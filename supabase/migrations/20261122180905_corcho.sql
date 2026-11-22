-- Migración 32: el corcho del hogar.
--
-- Tres cosas, una tabla para cada una:
--   · household_wifi: la red y la contraseña del WiFi (una por hogar). La ven quienes viven en el hogar.
--   · household_payments: datos para pagar (Bizum o IBAN del casero, de las facturas...). Solo los ven los
--     adultos: los menores no los leen (lo impide el RLS, no solo la interfaz).
--   · board_notes: notas y normas (una nota fijada es una norma). Las ven y las clavan quienes viven en el hogar.
-- La app solo lee; WiFi y pagos los cambian los adultos, y todas las escrituras van por funciones.

-- ═════════════ 1. Tablas ═════════════
create type public.board_wifi_security as enum ('wpa', 'wep', 'nopass');
create type public.board_payment_kind as enum ('bizum', 'iban');

-- ¿Es un IBAN válido? Formato (2 letras, 2 dígitos de control y de 11 a 30 letras o números, sin espacios y en
-- mayúsculas) y dígitos de control: se mueven los 4 primeros caracteres al final, cada letra pasa a número
-- (A = 10 ... Z = 35) y el resto de dividir entre 97 tiene que ser 1. Se calcula cifra a cifra para no desbordar.
create function public.board_iban_valid(p_iban text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v text;
  d text;
  c text;
  r integer := 0;
  i integer;
  j integer;
begin
  if p_iban is null or p_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' then return false; end if;
  v := substr(p_iban, 5) || substr(p_iban, 1, 4);
  for i in 1..length(v) loop
    c := substr(v, i, 1);
    d := case when c ~ '[A-Z]' then (ascii(c) - 55)::text else c end;
    for j in 1..length(d) loop
      r := (r * 10 + substr(d, j, 1)::integer) % 97;
    end loop;
  end loop;
  return r = 1;
end $$;

create table public.household_wifi (
  household_id uuid primary key references public.households (id) on delete cascade,
  ssid         text not null constraint household_wifi_ssid_length check (char_length(ssid) between 1 and 32),
  -- Vacía solo si la red no tiene contraseña
  password     text not null default '',
  security     public.board_wifi_security not null,
  updated_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint household_wifi_password_valid check (
    case security
      when 'nopass' then password = ''
      when 'wpa' then char_length(password) between 8 and 63
      when 'wep' then char_length(password) in (5, 13) or password ~ '^([0-9A-Fa-f]{10}|[0-9A-Fa-f]{26})$'
    end
  )
);
create index household_wifi_updated_by_idx on public.household_wifi (updated_by);
create trigger household_wifi_updated_at before update on public.household_wifi
  for each row execute function public.set_updated_at();

create table public.household_payments (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Para qué es: «Casero», «Luz y agua»...
  label        text not null constraint household_payments_label_length check (char_length(label) between 1 and 40),
  kind         public.board_payment_kind not null,
  -- Bizum: móvil de 9 cifras sin espacios. IBAN: sin espacios y en mayúsculas.
  value        text not null,
  position     integer not null default 0,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint household_payments_value_valid check (
    case kind
      when 'bizum' then value ~ '^[67][0-9]{8}$'
      when 'iban' then public.board_iban_valid(value)
    end
  )
);
create index household_payments_household_idx on public.household_payments (household_id, position);
create index household_payments_created_by_idx on public.household_payments (created_by);

create table public.board_notes (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  body         text not null constraint board_notes_body_length check (char_length(body) between 1 and 200),
  -- Fijada = norma de la casa (sale arriba). Solo la fija un adulto.
  pinned       boolean not null default false,
  -- Si quien la puso borra su cuenta, la nota se queda sin autor
  author_id    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index board_notes_household_idx on public.board_notes (household_id, created_at);
create index board_notes_author_idx on public.board_notes (author_id);

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.household_wifi, public.household_payments, public.board_notes from anon, authenticated;
grant select on public.household_wifi, public.household_payments, public.board_notes to authenticated;
alter table public.household_wifi enable row level security;
alter table public.household_payments enable row level security;
alter table public.board_notes enable row level security;

-- WiFi y notas: quien vive en el hogar (adultos y menores; ni el casero ni quien se fue)
create policy "household_wifi_select" on public.household_wifi for select to authenticated
  using (public.is_household_resident(household_id));
create policy "board_notes_select" on public.board_notes for select to authenticated
  using (public.is_household_resident(household_id));
-- Pagos: solo los adultos
create policy "household_payments_select" on public.household_payments for select to authenticated
  using (public.is_household_adult(household_id));

-- ═════════════ 2. WiFi ═════════════
-- Poner o cambiar el WiFi (un adulto). Con "nopass" la contraseña se guarda vacía.
create function public.set_household_wifi(
  p_household uuid, p_ssid text, p_password text, p_security public.board_wifi_security
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid        uuid := (select auth.uid());
  v_password text := case when p_security = 'nopass' then '' else coalesce(p_password, '') end;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can manage the board'; end if;
  if p_security is null or coalesce(btrim(p_ssid), '') = '' or char_length(p_ssid) > 32
     or (p_security = 'nopass' and coalesce(p_password, '') <> '')
     or (p_security = 'wpa' and char_length(v_password) not between 8 and 63)
     or (p_security = 'wep' and not (char_length(v_password) in (5, 13)
                                     or v_password ~ '^([0-9A-Fa-f]{10}|[0-9A-Fa-f]{26})$')) then
    raise exception 'Invalid wifi';
  end if;

  insert into public.household_wifi (household_id, ssid, password, security, updated_by)
  values (p_household, p_ssid, v_password, p_security, uid)
  on conflict (household_id) do update
  set ssid = excluded.ssid, password = excluded.password, security = excluded.security, updated_by = uid;
end $$;

-- Quitar el WiFi (un adulto)
create function public.delete_household_wifi(p_household uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can manage the board'; end if;
  delete from public.household_wifi where household_id = p_household;
end $$;

-- ═════════════ 3. Pagos ═════════════
-- Añadir un dato de pago (un adulto). Se guarda normalizado: Bizum solo con las 9 cifras (sin +34 ni 0034),
-- IBAN sin espacios y en mayúsculas. Como mucho 10 por hogar.
create function public.add_household_payment(
  p_household uuid, p_label text, p_kind public.board_payment_kind, p_value text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_value text;
  v_id    uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can manage the board'; end if;
  -- Uno detrás de otro en el mismo hogar, para que el límite se cumpla aunque se añadan dos a la vez
  perform 1 from public.households where id = p_household for update;
  if (select count(*) from public.household_payments where household_id = p_household) >= 10 then
    raise exception 'Too many payments';
  end if;

  if p_kind = 'bizum' then
    v_value := regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g');
    if char_length(v_value) = 13 and v_value like '0034%' then v_value := substr(v_value, 5);
    elsif char_length(v_value) = 11 and v_value like '34%' then v_value := substr(v_value, 3);
    end if;
    if v_value !~ '^[67][0-9]{8}$' then raise exception 'Invalid Bizum number'; end if;
  elsif p_kind = 'iban' then
    v_value := upper(regexp_replace(coalesce(p_value, ''), '\s', '', 'g'));
    if not public.board_iban_valid(v_value) then raise exception 'Invalid IBAN'; end if;
  else
    raise exception 'Invalid payment';
  end if;

  insert into public.household_payments (household_id, label, kind, value, position, created_by)
  values (p_household, btrim(p_label), p_kind, v_value,
          coalesce((select max(position) + 1 from public.household_payments where household_id = p_household), 0), uid)
  returning id into v_id;
  return v_id;
end $$;

-- Quitar un dato de pago (un adulto del hogar)
create function public.delete_household_payment(p_payment uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_household uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select household_id into v_household from public.household_payments where id = p_payment;
  if v_household is null then raise exception 'Not found'; end if;
  if not public.is_household_adult(v_household) then raise exception 'Only adult members can manage the board'; end if;
  delete from public.household_payments where id = p_payment;
end $$;

-- ═════════════ 4. Notas y normas ═════════════
-- Clavar una nota (cualquiera que viva en el hogar). Fijarla como norma, solo un adulto. Como mucho 50.
create function public.add_board_note(p_household uuid, p_body text, p_pinned boolean default false) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  v_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_resident(p_household) then raise exception 'Not found'; end if;
  if coalesce(p_pinned, false) and not public.is_household_adult(p_household) then
    raise exception 'Only an adult can pin notes';
  end if;
  perform 1 from public.households where id = p_household for update;
  if (select count(*) from public.board_notes where household_id = p_household) >= 50 then
    raise exception 'Too many notes';
  end if;

  insert into public.board_notes (household_id, body, pinned, author_id)
  values (p_household, btrim(p_body), coalesce(p_pinned, false), uid)
  returning id into v_id;
  return v_id;
end $$;

-- Fijar una nota como norma o quitarla de las normas (un adulto)
create function public.set_board_note_pinned(p_note uuid, p_pinned boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_household uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select household_id into v_household from public.board_notes where id = p_note;
  if v_household is null or not public.is_household_resident(v_household) then raise exception 'Not found'; end if;
  if not public.is_household_adult(v_household) then raise exception 'Only an adult can pin notes'; end if;
  update public.board_notes set pinned = coalesce(p_pinned, false) where id = p_note;
end $$;

-- Quitar una nota: quien la puso o un admin del hogar
create function public.delete_board_note(p_note uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  n   public.board_notes;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into n from public.board_notes where id = p_note;
  if not found or not public.is_household_resident(n.household_id) then raise exception 'Not found'; end if;
  if n.author_id is distinct from uid and not public.is_household_admin(n.household_id) then
    raise exception 'You can only remove your own notes';
  end if;
  delete from public.board_notes where id = p_note;
end $$;

-- ═════════════ 5. Permisos de ejecución ═════════════
revoke execute on function public.board_iban_valid(text) from public, anon, authenticated;

revoke execute on function public.set_household_wifi(uuid, text, text, public.board_wifi_security) from public, anon;
revoke execute on function public.delete_household_wifi(uuid) from public, anon;
revoke execute on function public.add_household_payment(uuid, text, public.board_payment_kind, text) from public, anon;
revoke execute on function public.delete_household_payment(uuid) from public, anon;
revoke execute on function public.add_board_note(uuid, text, boolean) from public, anon;
revoke execute on function public.set_board_note_pinned(uuid, boolean) from public, anon;
revoke execute on function public.delete_board_note(uuid) from public, anon;

grant execute on function public.set_household_wifi(uuid, text, text, public.board_wifi_security) to authenticated;
grant execute on function public.delete_household_wifi(uuid) to authenticated;
grant execute on function public.add_household_payment(uuid, text, public.board_payment_kind, text) to authenticated;
grant execute on function public.delete_household_payment(uuid) to authenticated;
grant execute on function public.add_board_note(uuid, text, boolean) to authenticated;
grant execute on function public.set_board_note_pinned(uuid, boolean) to authenticated;
grant execute on function public.delete_board_note(uuid) to authenticated;
