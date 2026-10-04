-- HAPPA · Migración 11: horarios semanales y ausencias (quién está en casa)
--
-- Reglas:
--   · Cada persona tiene, en cada hogar, su horario de la semana: franjas de un día (lunes a domingo) con
--     hora de inicio y de fin y un tipo (clase, trabajo o fuera), más una etiqueta opcional.
--   · Las franjas de una persona no se pisan entre sí el mismo día. Como mucho 50 por persona y hogar.
--   · Una franja no pasa de medianoche: si alguien trabaja de 22:00 a 6:00, son dos franjas.
--   · Ausencias: "estoy fuera del día X al día Y" (días completos, hasta un año), con una nota opcional.
--     No se pisan entre sí y no se apuntan en el pasado.
--   · Lo ven todos los que viven en el hogar (adultos y menores). El casero y quien ya se fue, no.
--   · Cada uno cambia lo suyo. Un tutor también cambia lo de su menor, si viven en el mismo hogar.
--   · Se puede copiar el horario propio de otro hogar (sustituye al que hubiera en este).
--   · Al irse del hogar (o borrar la cuenta) se borran su horario y sus ausencias de ese hogar.
--   · Las horas son las del reloj del hogar (su zona horaria), sin fecha: "los lunes de 9:00 a 14:00".

-- ═════════════ 1. Tablas ═════════════
create type public.schedule_kind as enum ('class', 'work', 'away');

create table public.schedule_blocks (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- 1 = lunes ... 7 = domingo (como ISO 8601)
  weekday      smallint not null constraint schedule_blocks_weekday_range check (weekday between 1 and 7),
  starts_at    time not null,
  ends_at      time not null,
  kind         public.schedule_kind not null default 'class',
  label        text constraint schedule_blocks_label_length check (label is null or char_length(label) between 1 and 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint schedule_blocks_order check (starts_at < ends_at),
  constraint schedule_blocks_whole_minutes check (extract(second from starts_at) = 0 and extract(second from ends_at) = 0)
);
create index schedule_blocks_person_idx on public.schedule_blocks (household_id, user_id, weekday, starts_at);
create index schedule_blocks_user_idx on public.schedule_blocks (user_id);
create trigger schedule_blocks_updated_at before update on public.schedule_blocks
  for each row execute function public.set_updated_at();

create table public.absences (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- Días completos, los dos incluidos
  starts_on    date not null,
  ends_on      date not null,
  note         text constraint absences_note_length check (note is null or char_length(note) between 1 and 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint absences_order check (starts_on <= ends_on),
  constraint absences_max_length check (ends_on - starts_on <= 365)
);
create index absences_household_idx on public.absences (household_id, ends_on);
create index absences_user_idx on public.absences (user_id);
create trigger absences_updated_at before update on public.absences
  for each row execute function public.set_updated_at();

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.schedule_blocks, public.absences from anon, authenticated;
grant select on public.schedule_blocks, public.absences to authenticated;
alter table public.schedule_blocks enable row level security;
alter table public.absences enable row level security;

-- Los ve quien vive en el hogar (adultos y menores; ni el casero ni quien se fue)
create policy "schedule_blocks_select" on public.schedule_blocks for select to authenticated
  using (public.is_household_resident(household_id));
create policy "absences_select" on public.absences for select to authenticated
  using (public.is_household_resident(household_id));

-- ═════════════ 2. Funciones internas ═════════════
-- ¿Puedes cambiar el horario de p_user en este hogar? Tienes que vivir en él, y esa persona también;
-- y ser tú o su tutor.
create function public.schedule_can_edit(p_household uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_household_resident(p_household)
     and exists (
       select 1 from public.household_members m
       where m.household_id = p_household and m.user_id = p_user
         and m.role in ('admin', 'member', 'minor') and m.left_at is null
     )
     and (p_user = (select auth.uid()) or public.is_guardian_of(p_user));
$$;

-- Bloquea la fila de esa persona en el hogar: dos cambios a la vez de su horario van uno detrás de otro
-- (así nunca se cuelan dos franjas que se pisan).
create function public.schedule_lock_person(p_household uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.household_members
  where household_id = p_household and user_id = p_user and left_at is null
  for update;
end $$;

-- Comprueba una franja: horas en orden y que no pise otra de esa persona ese día (salvo p_except)
create function public.schedule_check_block(
  p_household uuid, p_user uuid, p_weekday integer, p_starts time, p_ends time, p_except uuid
) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_weekday is null or p_weekday not between 1 and 7 then raise exception 'Invalid weekday'; end if;
  if p_starts is null or p_ends is null or p_starts >= p_ends then
    raise exception 'The end must be after the start';
  end if;
  if exists (
    select 1 from public.schedule_blocks b
    where b.household_id = p_household and b.user_id = p_user and b.weekday = p_weekday
      and b.starts_at < p_ends and p_starts < b.ends_at
      and b.id is distinct from p_except
  ) then
    raise exception 'Schedule blocks cannot overlap';
  end if;
end $$;

-- Comprueba una ausencia: fechas en orden, no en el pasado, como mucho un año adelante y sin pisar otra
create function public.absence_check(
  p_household uuid, p_user uuid, p_starts date, p_ends date, p_except uuid
) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  v_today date := public.triqui_household_today(p_household);
begin
  if p_starts is null or p_ends is null or p_starts > p_ends then
    raise exception 'The end must be after the start';
  end if;
  if p_ends < v_today then raise exception 'Absences cannot be in the past'; end if;
  if p_starts > v_today + 366 or p_ends - p_starts > 365 then raise exception 'Absences can be up to a year'; end if;
  if exists (
    select 1 from public.absences a
    where a.household_id = p_household and a.user_id = p_user
      and a.starts_on <= p_ends and p_starts <= a.ends_on
      and a.id is distinct from p_except
  ) then
    raise exception 'Absences cannot overlap';
  end if;
end $$;

-- ═════════════ 3. Horario (RPC) ═════════════
-- Añade la misma franja a uno o varios días (por ejemplo, clase de lunes a viernes de 9:00 a 14:00).
-- O se añaden todas o ninguna. p_user: de quién es (si no se indica, tuyo). Devuelve cuántas añadió.
create function public.add_schedule_blocks(
  p_household uuid, p_weekdays integer[], p_starts_at time, p_ends_at time,
  p_kind public.schedule_kind, p_label text default null, p_user uuid default null
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  v_user   uuid := coalesce(p_user, (select auth.uid()));
  v_days   integer[];
  v_day    integer;
  v_label  text := nullif(btrim(p_label), '');
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.schedule_can_edit(p_household, v_user) then raise exception 'You cannot change this schedule'; end if;

  select array_agg(distinct d order by d) into v_days from unnest(p_weekdays) d where d is not null;
  if v_days is null then raise exception 'Choose at least one day'; end if;

  perform public.schedule_lock_person(p_household, v_user);
  if (select count(*) from public.schedule_blocks where household_id = p_household and user_id = v_user)
     + cardinality(v_days) > 50 then
    raise exception 'Too many schedule blocks';
  end if;

  foreach v_day in array v_days loop
    perform public.schedule_check_block(p_household, v_user, v_day, p_starts_at, p_ends_at, null);
    insert into public.schedule_blocks (household_id, user_id, weekday, starts_at, ends_at, kind, label)
    values (p_household, v_user, v_day, p_starts_at, p_ends_at, coalesce(p_kind, 'class'), v_label);
  end loop;
  return cardinality(v_days);
end $$;

-- Cambia una franja
create function public.update_schedule_block(
  p_block uuid, p_weekday integer, p_starts_at time, p_ends_at time,
  p_kind public.schedule_kind, p_label text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  b public.schedule_blocks;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into b from public.schedule_blocks where id = p_block;
  if not found or not public.schedule_can_edit(b.household_id, b.user_id) then
    raise exception 'You cannot change this schedule';
  end if;

  perform public.schedule_lock_person(b.household_id, b.user_id);
  perform public.schedule_check_block(b.household_id, b.user_id, p_weekday, p_starts_at, p_ends_at, b.id);
  update public.schedule_blocks
  set weekday = p_weekday, starts_at = p_starts_at, ends_at = p_ends_at, kind = coalesce(p_kind, kind),
      label = nullif(btrim(p_label), '')
  where id = b.id;
end $$;

-- Borra una franja
create function public.delete_schedule_block(p_block uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  b public.schedule_blocks;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into b from public.schedule_blocks where id = p_block;
  if not found or not public.schedule_can_edit(b.household_id, b.user_id) then
    raise exception 'You cannot change this schedule';
  end if;
  delete from public.schedule_blocks where id = b.id;
end $$;

-- Copia tu horario de otro hogar en el que vives a este (sustituye el que tuvieras aquí).
-- Devuelve cuántas franjas copió.
create function public.copy_schedule(p_from uuid, p_to uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  n   integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_from is not distinct from p_to
     or not public.schedule_can_edit(p_from, uid) or not public.schedule_can_edit(p_to, uid) then
    raise exception 'You cannot change this schedule';
  end if;
  if not exists (select 1 from public.schedule_blocks where household_id = p_from and user_id = uid) then
    raise exception 'There is no schedule to copy';
  end if;

  perform public.schedule_lock_person(p_to, uid);
  delete from public.schedule_blocks where household_id = p_to and user_id = uid;
  insert into public.schedule_blocks (household_id, user_id, weekday, starts_at, ends_at, kind, label)
  select p_to, uid, weekday, starts_at, ends_at, kind, label
  from public.schedule_blocks where household_id = p_from and user_id = uid;
  get diagnostics n = row_count;
  return n;
end $$;

-- ═════════════ 4. Ausencias (RPC) ═════════════
-- Crea (sin p_absence) o cambia (con p_absence) una ausencia. p_user: de quién es (si no, tuya).
create function public.save_absence(
  p_household uuid, p_starts_on date, p_ends_on date, p_note text default null,
  p_absence uuid default null, p_user uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  a      public.absences;
  v_user uuid;
  v_id   uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_absence is not null then
    select * into a from public.absences where id = p_absence;
    if not found or a.household_id is distinct from p_household
       or not public.schedule_can_edit(a.household_id, a.user_id) then
      raise exception 'You cannot change this schedule';
    end if;
    v_user := a.user_id;
  else
    v_user := coalesce(p_user, uid);
    if not public.schedule_can_edit(p_household, v_user) then raise exception 'You cannot change this schedule'; end if;
  end if;

  perform public.schedule_lock_person(p_household, v_user);
  perform public.absence_check(p_household, v_user, p_starts_on, p_ends_on, p_absence);

  if p_absence is not null then
    update public.absences set starts_on = p_starts_on, ends_on = p_ends_on, note = nullif(btrim(p_note), '')
    where id = p_absence
    returning id into v_id;
  else
    if (select count(*) from public.absences where household_id = p_household and user_id = v_user) >= 100 then
      raise exception 'Too many absences';
    end if;
    insert into public.absences (household_id, user_id, starts_on, ends_on, note)
    values (p_household, v_user, p_starts_on, p_ends_on, nullif(btrim(p_note), ''))
    returning id into v_id;
  end if;
  return v_id;
end $$;

-- Borra una ausencia
create function public.delete_absence(p_absence uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  a public.absences;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into a from public.absences where id = p_absence;
  if not found or not public.schedule_can_edit(a.household_id, a.user_id) then
    raise exception 'You cannot change this schedule';
  end if;
  delete from public.absences where id = a.id;
end $$;

-- ═════════════ 5. Al irse del hogar ═════════════
-- Quien se va (o borra su cuenta) deja de compartir su horario y sus ausencias con ese hogar.
create function public.schedule_member_left() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.schedule_blocks where household_id = new.household_id and user_id = new.user_id;
  delete from public.absences where household_id = new.household_id and user_id = new.user_id;
  return new;
end $$;
create trigger household_members_left_schedule
  after update of left_at on public.household_members
  for each row when (old.left_at is null and new.left_at is not null)
  execute function public.schedule_member_left();

-- ═════════════ 6. Permisos de ejecución ═════════════
revoke execute on function public.schedule_can_edit(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.schedule_lock_person(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.schedule_check_block(uuid, uuid, integer, time, time, uuid) from public, anon, authenticated;
revoke execute on function public.absence_check(uuid, uuid, date, date, uuid) from public, anon, authenticated;
revoke execute on function public.schedule_member_left() from public, anon, authenticated;

revoke execute on function public.add_schedule_blocks(uuid, integer[], time, time, public.schedule_kind, text, uuid) from public, anon;
revoke execute on function public.update_schedule_block(uuid, integer, time, time, public.schedule_kind, text) from public, anon;
revoke execute on function public.delete_schedule_block(uuid) from public, anon;
revoke execute on function public.copy_schedule(uuid, uuid) from public, anon;
revoke execute on function public.save_absence(uuid, date, date, text, uuid, uuid) from public, anon;
revoke execute on function public.delete_absence(uuid) from public, anon;

grant execute on function public.add_schedule_blocks(uuid, integer[], time, time, public.schedule_kind, text, uuid) to authenticated;
grant execute on function public.update_schedule_block(uuid, integer, time, time, public.schedule_kind, text) to authenticated;
grant execute on function public.delete_schedule_block(uuid) to authenticated;
grant execute on function public.copy_schedule(uuid, uuid) to authenticated;
grant execute on function public.save_absence(uuid, date, date, text, uuid, uuid) to authenticated;
grant execute on function public.delete_absence(uuid) to authenticated;
