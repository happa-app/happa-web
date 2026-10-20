-- HAPPA · Migración 19: privacidad (decisiones de cada persona) y código postal del hogar
--
-- Reglas (diseño: docs/superpowers/specs/2026-10-20-privacidad-design.md):
--   · Cada persona decide dos cosas opcionales: recibir comunicaciones de HAPPA ("marketing") y que HAPPA
--     ceda sus datos a empresas colaboradoras para sus ofertas ("partners"). Por defecto, no.
--   · Cada decisión se guarda como una fila nueva (nunca se cambia ni se borra una fila): lo vigente es la
--     última, y las anteriores son la prueba de qué aceptó cada persona, cuándo y con qué texto.
--   · Se decide al registrarse (los datos del registro traen "choices") y después desde Perfil → Privacidad.
--     Los menores no pueden aceptar nada.
--   · Al borrar la cuenta, sus filas se quedan bloqueadas 3 años (art. 32 LOPDGDD): nadie las ve desde la
--     app ni salen en la lista para colaboradores. Pasados los 3 años, privacy_choices_purge() las borra.
--   · El hogar puede tener un código postal (opcional, 5 cifras; nunca la dirección), que pone o quita el
--     admin. Sirve para mostrar servicios cerca y, solo con "partners", se cede a colaboradores.
--   · private.partners_optin es la lista de quien acepta "partners" ahora mismo, con su correo: no se puede
--     leer desde la app (esquema private), solo desde el SQL Editor de Supabase o una copia de la base de datos.

-- ═════════════ 1. Código postal del hogar ═════════════
alter table public.households
  add column postal_code text constraint households_postal_code_format check (postal_code ~ '^[0-9]{5}$');

-- Deja el código postal como debe guardarse: sin espacios, null si está vacío. Si no son 5 cifras, error.
create function public.normalize_postal_code(p_code text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  v_code text := nullif(replace(coalesce(p_code, ''), ' ', ''), '');
begin
  if v_code is not null and v_code !~ '^[0-9]{5}$' then raise exception 'Invalid postal code'; end if;
  return v_code;
end $$;

-- Crear hogar: igual que en la migración 15, y además el código postal (opcional)
drop function public.create_household(text, public.household_kind, integer);

create function public.create_household(
  p_name        text,
  p_kind        public.household_kind default 'shared_flat',
  p_max_members integer default null,
  p_postal_code text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
  v_tz    text;
  v_max   integer := coalesce(p_max_members, public.household_default_places(p_kind));
  v_code  text := public.normalize_postal_code(p_postal_code);
  hid     uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor, timezone into v_minor, v_tz from public.profiles where id = uid;
  if coalesce(v_minor, false) then raise exception 'Minor accounts cannot create households'; end if;
  if v_max < 1 or v_max > 20 then raise exception 'Places must be between 1 and 20'; end if;

  insert into public.households (name, kind, created_by, timezone, max_members, postal_code)
  values (p_name, p_kind, uid, coalesce(v_tz, 'Europe/Madrid'), v_max, v_code)
  returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, uid, 'admin');
  return hid;
end $$;

revoke execute on function public.create_household(text, public.household_kind, integer, text) from public, anon;
grant  execute on function public.create_household(text, public.household_kind, integer, text) to authenticated;

-- Poner, cambiar o quitar (vacío) el código postal: solo el admin
create function public.set_household_postal_code(p_household uuid, p_postal_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_code text := public.normalize_postal_code(p_postal_code);
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_admin(p_household) then raise exception 'Only an admin can change the postal code'; end if;
  update public.households set postal_code = v_code where id = p_household;
end $$;

revoke execute on function public.set_household_postal_code(uuid, text) from public, anon;
grant  execute on function public.set_household_postal_code(uuid, text) to authenticated;

-- ═════════════ 2. Decisiones de privacidad ═════════════
create table public.privacy_choices (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  purpose      text not null check (purpose in ('marketing', 'partners')),
  granted      boolean not null,
  -- Versión del texto que vio la persona (src/features/legal/versions.ts)
  text_version text not null check (char_length(text_version) between 1 and 20),
  source       text not null check (source in ('signup', 'settings')),
  created_at   timestamptz not null default now()
);
-- Para sacar rápido la última decisión de cada persona y finalidad
create index privacy_choices_latest_idx on public.privacy_choices (user_id, purpose, created_at desc, id desc);

alter table public.privacy_choices enable row level security;
-- Solo se escriben con set_privacy_choice y al registrarse, para que la fecha y el origen los ponga el servidor
revoke insert, update, delete on public.privacy_choices from anon, authenticated;
create policy "privacy_choices_select_own" on public.privacy_choices for select to authenticated
  using (user_id = (select auth.uid()));

-- Cambiar una decisión desde Perfil → Privacidad (añade una fila; no cambia las anteriores)
create function public.set_privacy_choice(p_purpose text, p_granted boolean, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor into v_minor from public.profiles where id = uid and deleted_at is null;
  if not found then raise exception 'Not authenticated'; end if;
  if v_minor then raise exception 'Minor accounts cannot change this'; end if;
  if p_purpose is null or p_purpose not in ('marketing', 'partners') then raise exception 'Invalid choice'; end if;
  if p_granted is null then raise exception 'Invalid choice'; end if;
  if char_length(coalesce(p_version, '')) not between 1 and 20 then raise exception 'Invalid choice'; end if;

  insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
  values (uid, p_purpose, p_granted, p_version, 'settings');
end $$;

revoke execute on function public.set_privacy_choice(text, boolean, text) from public, anon;
grant  execute on function public.set_privacy_choice(text, boolean, text) to authenticated;


-- Lo que tienes decidido ahora (solo lo tuyo). Si nunca decidiste algo, no sale: cuenta como "no".
create function public.get_my_privacy_choices()
returns table (purpose text, granted boolean, changed_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select distinct on (c.purpose) c.purpose, c.granted, c.created_at
  from public.privacy_choices c
  where c.user_id = (select auth.uid())
  order by c.purpose, c.created_at desc, c.id desc;
$$;

revoke execute on function public.get_my_privacy_choices() from public, anon;
grant  execute on function public.get_my_privacy_choices() to authenticated;

-- ═════════════ 3. Al registrarse: perfil, consentimientos legales y decisiones de privacidad ═════════════
-- Igual que en la migración 4, y además: si los datos del registro traen
-- "choices": { "marketing": true|false, "partners": true|false, "version": "v1" },
-- se guardan las dos decisiones (también las que son "no": así queda constancia de que se preguntó).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz      text  := new.raw_user_meta_data ->> 'timezone';
  v_legal   jsonb := new.raw_user_meta_data -> 'legal';
  v_choices jsonb := new.raw_user_meta_data -> 'choices';
  v_doc     text;
  v_ver     text;
  v_purpose text;
begin
  insert into public.profiles (id, display_name, locale, timezone)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 60),
    case when new.raw_user_meta_data ->> 'locale' in ('es', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'es' end,
    case when v_tz is not null and public.is_valid_timezone(v_tz) then v_tz else 'Europe/Madrid' end
  );

  if jsonb_typeof(v_legal) = 'object' then
    for v_doc, v_ver in select key, value from jsonb_each_text(v_legal) loop
      if v_doc in ('terms', 'privacy') and char_length(coalesce(v_ver, '')) between 1 and 20 then
        insert into public.legal_consents (user_id, accepted_by, document, version)
        values (new.id, new.id, v_doc, v_ver)
        on conflict (user_id, document, version) do nothing;
      end if;
    end loop;
  end if;

  v_ver := v_choices ->> 'version';
  if jsonb_typeof(v_choices) = 'object' and char_length(coalesce(v_ver, '')) between 1 and 20 then
    foreach v_purpose in array array['marketing', 'partners'] loop
      insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
      values (new.id, v_purpose, coalesce(v_choices -> v_purpose = 'true'::jsonb, false), v_ver, 'signup');
    end loop;
  end if;

  return new;
end $$;

-- ═════════════ 4. Lista para empresas colaboradoras (solo administración) ═════════════
-- Quien tiene "partners" aceptado ahora mismo (sin menores ni cuentas borradas), con lo que se puede ceder:
-- nombre, correo, idioma y, de cada hogar en el que vive ahora, tipo, personas y código postal (una fila
-- por persona y hogar; sin hogar, una fila sin esos datos). Nunca la dirección, el chat, los gastos...
create view private.partners_optin as
with latest as (
  select distinct on (c.user_id) c.user_id, c.granted, c.text_version, c.created_at
  from public.privacy_choices c
  where c.purpose = 'partners'
  order by c.user_id, c.created_at desc, c.id desc
)
select
  p.id                                    as user_id,
  p.display_name                          as name,
  u.email,
  p.locale,
  h.kind                                  as household_kind,
  public.household_resident_count(h.id)   as household_size,
  h.postal_code,
  l.created_at                            as accepted_at,
  l.text_version
from latest l
join public.profiles p on p.id = l.user_id
join auth.users u on u.id = p.id
left join lateral (
  select hh.id, hh.kind, hh.postal_code
  from public.household_members m
  join public.households hh on hh.id = m.household_id
  where m.user_id = p.id and m.left_at is null and m.role in ('admin', 'member') and hh.archived_at is null
) h on true
where l.granted and not p.is_minor and p.deleted_at is null;

revoke all on private.partners_optin from public, anon, authenticated;

-- ═════════════ 5. Borrado a los 3 años ═════════════
-- Borra la prueba de los consentimientos (las decisiones de privacidad y los términos y la privacidad
-- aceptados, legal_consents) de las cuentas borradas hace más de 3 años. Devuelve cuántas filas ha borrado.
-- No se puede llamar desde la app. Para que se haga sola, en Supabase: Database → Extensions → activar
-- pg_cron, y en el SQL Editor:
--   select cron.schedule('privacidad-purga', '30 4 * * 0', 'select public.privacy_choices_purge()');
create function public.privacy_choices_purge() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_choices integer;
  v_legal   integer;
begin
  delete from public.privacy_choices c
  using public.profiles p
  where p.id = c.user_id and p.deleted_at is not null and p.deleted_at < now() - interval '3 years';
  get diagnostics v_choices = row_count;

  delete from public.legal_consents c
  using public.profiles p
  where p.id = c.user_id and p.deleted_at is not null and p.deleted_at < now() - interval '3 years';
  get diagnostics v_legal = row_count;

  return v_choices + v_legal;
end $$;

revoke execute on function public.privacy_choices_purge() from public, anon, authenticated;
