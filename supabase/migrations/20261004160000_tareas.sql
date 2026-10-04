-- HAPPA · Migración 12: tareas del hogar
--
-- Reglas:
--   · Una tarea (fregar, sacar la basura...) se repite: una vez, cada N días, ciertos días de la semana cada
--     N semanas, o cada N meses. Tiene un esfuerzo (1 ligera, 2 normal, 3 pesada) y una nota opcional.
--   · Se asigna fija a una persona, por turnos entre varias (en el orden elegido) o libre (quien la coja).
--   · Los días de las próximas dos semanas se crean solos (al abrir la app), cada uno con a quién le toca.
--   · Turnos y ausencias: si a alguien le toca un día que está de ausencia, se salta y le toca al siguiente;
--     cuando vuelve, le toca a él el siguiente día para compensar. Si apunta (o cambia) una ausencia después,
--     los días que vienen se rehacen.
--   · Hecha: cuenta al marcarla. Si la tarea pide visto bueno y la marca un menor, queda esperando a que
--     un adulto la dé por buena. Cualquier adulto del hogar puede decir "no está hecha" y vuelve a pendiente.
--   · Si se pasa el día, sigue siendo de esa persona (atrasada) y los turnos siguen.
--   · Crean, cambian y reparten tareas los adultos del hogar. Los menores ven las tareas, marcan las suyas
--     y pueden quedarse una libre. El casero no ve nada.
--   · Un día se puede cambiar a otra persona (lo hace un adulto) o "quedárselo" si está libre; esos cambios
--     a mano no se pierden cuando se rehacen los días que vienen.
--   · Quien se va del hogar sale de los turnos; lo que tenía pendiente queda libre o se rehace.
--   · Borrar una tarea quita lo pendiente; lo ya hecho se queda en el historial.

-- ═════════════ 1. Tablas ═════════════
create type public.chore_frequency as enum ('once', 'daily', 'weekly', 'monthly');
create type public.chore_assignment as enum ('fixed', 'rotation', 'free');
create type public.chore_status as enum ('pending', 'review', 'done');

create table public.chores (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  title             text not null constraint chores_title_length check (char_length(title) between 1 and 60),
  notes             text constraint chores_notes_length check (notes is null or char_length(notes) between 1 and 200),
  effort            smallint not null default 2 constraint chores_effort_range check (effort between 1 and 3),
  frequency         public.chore_frequency not null,
  -- Cada cuántos días, semanas o meses
  interval_count    smallint not null default 1 constraint chores_interval_range check (interval_count between 1 and 12),
  -- Solo semanal: qué días (1 = lunes ... 7 = domingo)
  weekdays          smallint[],
  -- Primer día (en "una vez", el único)
  starts_on         date not null,
  assignment        public.chore_assignment not null,
  -- Solo "fija": de quién es
  assignee_id       uuid references public.profiles (id) on delete set null,
  -- Si la marca un menor, un adulto tiene que darla por buena
  requires_approval boolean not null default false,
  -- false = borrada (lo hecho se queda en el historial)
  active            boolean not null default true,
  -- Días creados hasta aquí (incluido)
  generated_until   date,
  -- Turnos: posición desde la que se busca a quién le toca
  rotation_next     integer not null default 0,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chores_weekdays_valid check (
    (frequency = 'weekly') = (weekdays is not null)
    and (weekdays is null or (cardinality(weekdays) between 1 and 7 and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]))
  ),
  constraint chores_fixed_assignee check (assignment <> 'fixed' or assignee_id is not null)
);
create index chores_household_idx on public.chores (household_id) where active;
create index chores_assignee_idx on public.chores (assignee_id);
create index chores_created_by_idx on public.chores (created_by);
create trigger chores_updated_at before update on public.chores
  for each row execute function public.set_updated_at();

-- Quiénes entran en los turnos y en qué orden. owed: se saltó su turno por una ausencia y le toca al volver.
create table public.chore_rotation (
  chore_id uuid not null references public.chores (id) on delete cascade,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  owed     boolean not null default false,
  primary key (chore_id, user_id),
  constraint chore_rotation_position_unique unique (chore_id, position)
);
create index chore_rotation_user_idx on public.chore_rotation (user_id);

-- Cada día que toca hacer una tarea
create table public.chore_occurrences (
  id             uuid primary key default gen_random_uuid(),
  chore_id       uuid not null references public.chores (id) on delete cascade,
  household_id   uuid not null references public.households (id) on delete cascade,
  due_on         date not null,
  -- null = libre (cualquiera puede quedársela)
  assignee_id    uuid references public.profiles (id) on delete set null,
  status         public.chore_status not null default 'pending',
  done_by        uuid references public.profiles (id) on delete set null,
  done_at        timestamptz,
  approved_by    uuid references public.profiles (id) on delete set null,
  approved_at    timestamptz,
  reopened_by    uuid references public.profiles (id) on delete set null,
  reopened_at    timestamptz,
  -- Cambiada a mano (otra persona o "me la quedo"): no se rehace
  manual         boolean not null default false,
  -- Para poder deshacer los turnos si se rehacen los días que vienen
  pointer_before integer,
  skipped_users  uuid[] not null default '{}',
  repaid_user    uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint chore_occurrences_day_unique unique (chore_id, due_on)
);
create index chore_occurrences_household_idx on public.chore_occurrences (household_id, due_on);
create index chore_occurrences_assignee_idx on public.chore_occurrences (assignee_id);
create index chore_occurrences_done_by_idx on public.chore_occurrences (done_by);
create index chore_occurrences_approved_by_idx on public.chore_occurrences (approved_by);
create index chore_occurrences_reopened_by_idx on public.chore_occurrences (reopened_by);
create trigger chore_occurrences_updated_at before update on public.chore_occurrences
  for each row execute function public.set_updated_at();

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.chores, public.chore_rotation, public.chore_occurrences from anon, authenticated;
grant select on public.chores, public.chore_rotation, public.chore_occurrences to authenticated;
alter table public.chores enable row level security;
alter table public.chore_rotation enable row level security;
alter table public.chore_occurrences enable row level security;

-- Las ve quien vive en el hogar (adultos y menores; ni el casero ni quien se fue)
create policy "chores_select" on public.chores for select to authenticated
  using (public.is_household_resident(household_id));
create policy "chore_rotation_select" on public.chore_rotation for select to authenticated
  using (exists (select 1 from public.chores c where c.id = chore_id));
create policy "chore_occurrences_select" on public.chore_occurrences for select to authenticated
  using (public.is_household_resident(household_id));

-- ═════════════ 2. Funciones internas ═════════════
-- ¿Vive p_user ahora en el hogar (adulto o menor; no el casero) y el hogar sigue activo?
create function public.household_has_resident(p_household uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household and m.user_id = p_user
      and m.role in ('admin', 'member', 'minor') and m.left_at is null and h.archived_at is null
  );
$$;

-- ¿Tiene esa persona una ausencia ese día en ese hogar?
create function public.chore_is_absent(p_household uuid, p_user uuid, p_day date) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.absences a
    where a.household_id = p_household and a.user_id = p_user and a.starts_on <= p_day and p_day <= a.ends_on
  );
$$;

-- ¿Toca la tarea ese día? (según cada cuánto se repite, contando desde el primer día)
create function public.chore_occurs_on(
  p_frequency public.chore_frequency, p_interval integer, p_weekdays smallint[], p_starts date, p_day date
) returns boolean
language sql immutable set search_path = '' as $$
  select p_day >= p_starts and case p_frequency
    when 'once' then p_day = p_starts
    when 'daily' then (p_day - p_starts) % p_interval = 0
    when 'weekly' then
      extract(isodow from p_day)::smallint = any (p_weekdays)
      -- semanas enteras entre el lunes de ese día y el lunes del primer día
      and ((p_day - (extract(isodow from p_day)::integer - 1)) - (p_starts - (extract(isodow from p_starts)::integer - 1))) / 7
          % p_interval = 0
    when 'monthly' then
      ((extract(year from p_day) - extract(year from p_starts)) * 12
        + extract(month from p_day) - extract(month from p_starts))::integer % p_interval = 0
      -- el mismo día del mes que el primero (o el último del mes si ese día no existe: 31 → 28 feb)
      and (p_starts + make_interval(months => ((extract(year from p_day) - extract(year from p_starts)) * 12
            + extract(month from p_day) - extract(month from p_starts))::integer))::date = p_day
  end;
$$;

-- Turnos: a quién le toca un día. Devuelve también lo necesario para deshacerlo:
--   pointer_before (el turno antes de elegir), skipped (a quién se saltó por ausencia) y repaid (quien
--   recupera un turno que se saltó). Actualiza el turno y quién debe recuperar.
create function public.chore_pick_rotation(
  p_chore uuid, p_household uuid, p_day date,
  out assignee uuid, out pointer_before integer, out skipped uuid[], out repaid uuid
)
language plpgsql security definer set search_path = '' as $$
declare
  m record;
begin
  select rotation_next into pointer_before from public.chores where id = p_chore;
  skipped := '{}';

  -- 1) Quien se saltó su turno por una ausencia y ya está en casa: le toca a él (el turno no avanza)
  select r.user_id into repaid
  from public.chore_rotation r
  where r.chore_id = p_chore and r.owed
    and public.household_has_resident(p_household, r.user_id)
    and not public.chore_is_absent(p_household, r.user_id, p_day)
  order by r.position
  limit 1;
  if repaid is not null then
    update public.chore_rotation set owed = false where chore_id = p_chore and user_id = repaid;
    assignee := repaid;
    return;
  end if;

  -- 2) El siguiente en el orden. Quien está de ausencia se salta (y le tocará al volver).
  for m in
    select r.user_id, r.position, r.owed
    from public.chore_rotation r
    where r.chore_id = p_chore and public.household_has_resident(p_household, r.user_id)
    order by (r.position < pointer_before), r.position
  loop
    if public.chore_is_absent(p_household, m.user_id, p_day) then
      if not m.owed then skipped := skipped || m.user_id; end if;
    else
      assignee := m.user_id;
      update public.chores set rotation_next = m.position + 1 where id = p_chore;
      update public.chore_rotation set owed = true where chore_id = p_chore and user_id = any (skipped);
      return;
    end if;
  end loop;

  -- 3) No hay nadie: queda libre y nadie debe nada
  skipped := '{}';
end $$;

-- Crea los días de las tareas activas de un hogar hasta dentro de dos semanas. Devuelve cuántos creó.
-- Si una tarea diera un error, se salta (queda en el registro de Supabase) y siguen las demás.
create function public.chores_generate(p_household uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_today date;
  v_until date;
  c       public.chores;
  v_day   date;
  v_pick  record;
  v_made  integer := 0;
  v_here  integer;
begin
  select (now() at time zone h.timezone)::date into v_today
  from public.households h where h.id = p_household and h.archived_at is null;
  if v_today is null then return 0; end if;
  v_until := v_today + 13;

  for c in
    select * from public.chores
    where household_id = p_household and active and (generated_until is null or generated_until < v_until)
    order by created_at, id
    for update skip locked
  loop
    begin
      v_here := 0;
      -- Lo que ya pasó sin que nadie abriera la app no se crea
      v_day := greatest(coalesce(c.generated_until + 1, c.starts_on), c.starts_on, v_today);
      while v_day <= v_until loop
        if public.chore_occurs_on(c.frequency, c.interval_count, c.weekdays, c.starts_on, v_day)
           and not exists (select 1 from public.chore_occurrences o where o.chore_id = c.id and o.due_on = v_day) then
          if c.assignment = 'rotation' then
            select * into v_pick from public.chore_pick_rotation(c.id, p_household, v_day);
            insert into public.chore_occurrences (chore_id, household_id, due_on, assignee_id, pointer_before,
                                                  skipped_users, repaid_user)
            values (c.id, p_household, v_day, v_pick.assignee, v_pick.pointer_before, v_pick.skipped, v_pick.repaid);
          else
            insert into public.chore_occurrences (chore_id, household_id, due_on, assignee_id)
            values (c.id, p_household, v_day,
                    case when c.assignment = 'fixed' and public.household_has_resident(p_household, c.assignee_id)
                         then c.assignee_id end);
          end if;
          v_here := v_here + 1;
        end if;
        v_day := v_day + 1;
      end loop;
      update public.chores set generated_until = v_until where id = c.id;
      v_made := v_made + v_here;
    exception when others then
      raise warning 'Tarea % sin crear sus días: %', c.id, sqlerrm;
    end;
  end loop;
  return v_made;
end $$;

-- Deshace (del último al primero) los días pendientes de una tarea desde p_from que no se han cambiado
-- a mano, devolviendo los turnos a como estaban. Después se vuelven a crear con chores_generate.
create function public.chore_reset_from(p_chore uuid, p_from date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences;
begin
  for o in
    select * from public.chore_occurrences
    where chore_id = p_chore and due_on >= p_from and status = 'pending' and not manual
    order by due_on desc
  loop
    if o.pointer_before is not null then
      update public.chores set rotation_next = o.pointer_before where id = p_chore;
    end if;
    if o.repaid_user is not null then
      update public.chore_rotation set owed = true where chore_id = p_chore and user_id = o.repaid_user;
    end if;
    if cardinality(o.skipped_users) > 0 then
      update public.chore_rotation set owed = false where chore_id = p_chore and user_id = any (o.skipped_users);
    end if;
    delete from public.chore_occurrences where id = o.id;
  end loop;
  update public.chores set generated_until = least(generated_until, p_from - 1) where id = p_chore;
end $$;

-- Comprueba los datos de una tarea y devuelve los días de la semana ordenados y sin repetir (semanal)
create function public.chore_check(
  p_household uuid, p_frequency public.chore_frequency, p_weekdays integer[], p_starts_on date,
  p_assignment public.chore_assignment, p_people uuid[], p_check_start boolean
) returns smallint[]
language plpgsql stable security definer set search_path = '' as $$
declare
  v_today date := public.triqui_household_today(p_household);
  v_days  smallint[];
begin
  if p_frequency is null or p_assignment is null then raise exception 'Invalid chore'; end if;
  if p_check_start and (p_starts_on is null or p_starts_on < v_today or p_starts_on > v_today + 366) then
    raise exception 'Invalid start date';
  end if;

  if p_frequency = 'weekly' then
    select array_agg(distinct d::smallint order by d::smallint) into v_days from unnest(p_weekdays) d where d is not null;
    if v_days is null then raise exception 'Choose at least one day'; end if;
    if not v_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] then raise exception 'Invalid weekday'; end if;
  end if;

  if p_assignment = 'fixed' and coalesce(cardinality(p_people), 0) <> 1 then
    raise exception 'A fixed chore needs exactly one person';
  end if;
  if p_assignment = 'rotation' and coalesce(cardinality(p_people), 0) = 0 then
    raise exception 'Choose who takes turns';
  end if;
  if p_assignment <> 'free' then
    if exists (select 1 from unnest(p_people) x where x is null)
       or cardinality(p_people) <> (select count(distinct x) from unnest(p_people) x) then
      raise exception 'Each person can only appear once';
    end if;
    if exists (select 1 from unnest(p_people) x where not public.household_has_resident(p_household, x)) then
      raise exception 'Everyone in a chore must live in the household';
    end if;
  end if;
  return v_days;
end $$;

-- ═════════════ 3. Tareas (RPC) ═════════════
-- Crear una tarea. p_people: en "fija", la persona; en "por turnos", el orden; en "libre", nada.
create function public.create_chore(
  p_household uuid, p_title text, p_effort integer, p_frequency public.chore_frequency, p_interval integer,
  p_weekdays integer[], p_starts_on date, p_assignment public.chore_assignment, p_people uuid[],
  p_requires_approval boolean default false, p_notes text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_days smallint[];
  v_id   uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can manage chores'; end if;
  v_days := public.chore_check(p_household, p_frequency, p_weekdays, p_starts_on, p_assignment, p_people, true);

  insert into public.chores (household_id, title, notes, effort, frequency, interval_count, weekdays, starts_on,
                             assignment, assignee_id, requires_approval, created_by)
  values (p_household, btrim(p_title), nullif(btrim(p_notes), ''), coalesce(p_effort, 2), p_frequency,
          coalesce(p_interval, 1), v_days, p_starts_on, p_assignment,
          case when p_assignment = 'fixed' then p_people[1] end, coalesce(p_requires_approval, false), uid)
  returning id into v_id;

  if p_assignment = 'rotation' then
    insert into public.chore_rotation (chore_id, user_id, position)
    select v_id, x, (n - 1)::integer from unnest(p_people) with ordinality as t(x, n);
  end if;

  perform public.chores_generate(p_household);
  return v_id;
end $$;

-- Cambiar una tarea (cualquier adulto del hogar). Los días que vienen se rehacen (menos los cambiados a mano).
-- Si el primer día no cambia, no se vuelve a comprobar (puede ser de hace tiempo).
create function public.update_chore(
  p_chore uuid, p_title text, p_effort integer, p_frequency public.chore_frequency, p_interval integer,
  p_weekdays integer[], p_starts_on date, p_assignment public.chore_assignment, p_people uuid[],
  p_requires_approval boolean default false, p_notes text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c      public.chores;
  v_days smallint[];
  v_today date;
  v_owed uuid[];
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into c from public.chores where id = p_chore and active for update;
  if not found or not public.is_household_adult(c.household_id) then raise exception 'Only adult members can manage chores'; end if;
  v_days := public.chore_check(c.household_id, p_frequency, p_weekdays, p_starts_on, p_assignment, p_people,
                               p_starts_on is distinct from c.starts_on);
  v_today := public.triqui_household_today(c.household_id);

  -- Primero se deshace lo que viene (con los turnos de antes)
  perform public.chore_reset_from(p_chore, v_today);

  update public.chores
  set title = btrim(p_title), notes = nullif(btrim(p_notes), ''), effort = coalesce(p_effort, 2),
      frequency = p_frequency, interval_count = coalesce(p_interval, 1), weekdays = v_days, starts_on = p_starts_on,
      assignment = p_assignment, assignee_id = case when p_assignment = 'fixed' then p_people[1] end,
      requires_approval = coalesce(p_requires_approval, false)
  where id = p_chore;

  -- Turnos nuevos: se conserva quién debe recuperar un turno; el turno vuelve al primero si cambia la lista
  if p_assignment = 'rotation' then
    if array(select user_id from public.chore_rotation where chore_id = p_chore order by position)
       is distinct from p_people then
      v_owed := array(select user_id from public.chore_rotation where chore_id = p_chore and owed);
      delete from public.chore_rotation where chore_id = p_chore;
      insert into public.chore_rotation (chore_id, user_id, position, owed)
      select p_chore, x, (n - 1)::integer, x = any (v_owed)
      from unnest(p_people) with ordinality as t(x, n);
      update public.chores set rotation_next = 0 where id = p_chore;
    end if;
  else
    delete from public.chore_rotation where chore_id = p_chore;
  end if;

  -- Lo pendiente que no cuadra con la tarea nueva (otro tipo de reparto, días que ya no tocan) se quita
  delete from public.chore_occurrences o
  where o.chore_id = p_chore and o.status = 'pending' and o.due_on >= v_today
    and not public.chore_occurs_on(p_frequency, coalesce(p_interval, 1), v_days, p_starts_on, o.due_on);

  perform public.chores_generate(c.household_id);
end $$;

-- Borrar una tarea (cualquier adulto): se quita lo pendiente; lo hecho se queda en el historial
create function public.delete_chore(p_chore uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.chores;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into c from public.chores where id = p_chore and active for update;
  if not found or not public.is_household_adult(c.household_id) then raise exception 'Only adult members can manage chores'; end if;
  delete from public.chore_occurrences where chore_id = p_chore and status = 'pending';
  update public.chores set active = false where id = p_chore;
end $$;

-- ═════════════ 4. Días (RPC) ═════════════
-- Lee el día y comprueba que vives en ese hogar
create function public.chore_occurrence_for_update(p_occurrence uuid) returns public.chore_occurrences
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into o from public.chore_occurrences where id = p_occurrence for update;
  if not found or not public.is_household_resident(o.household_id)
     or not exists (select 1 from public.chores c where c.id = o.chore_id and c.active) then
    raise exception 'Chore not found';
  end if;
  return o;
end $$;

-- Hecha. Un adulto puede marcar cualquiera; un menor, solo las suyas. Si la tarea pide visto bueno y la
-- marca un menor, queda esperando a un adulto.
create function public.complete_chore(p_occurrence uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  o        public.chore_occurrences := public.chore_occurrence_for_update(p_occurrence);
  v_adult  boolean := public.is_household_adult(o.household_id);
  v_review boolean;
begin
  if o.status <> 'pending' then raise exception 'This chore is already done'; end if;
  if not v_adult and o.assignee_id is distinct from uid then raise exception 'You can only mark your own chores'; end if;
  select c.requires_approval and not v_adult into v_review from public.chores c where c.id = o.chore_id;
  update public.chore_occurrences
  set status = case when v_review then 'review' else 'done' end::public.chore_status,
      done_by = uid, done_at = now(),
      approved_by = case when v_review then null else approved_by end, approved_at = null
  where id = o.id;
end $$;

-- Visto bueno de un adulto a una tarea que marcó un menor
create function public.approve_chore(p_occurrence uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences := public.chore_occurrence_for_update(p_occurrence);
begin
  if not public.is_household_adult(o.household_id) then raise exception 'Only an adult can approve chores'; end if;
  if o.status <> 'review' then raise exception 'This chore is not waiting for approval'; end if;
  update public.chore_occurrences set status = 'done', approved_by = (select auth.uid()), approved_at = now()
  where id = o.id;
end $$;

-- "No está hecha": vuelve a pendiente. Un adulto, cualquiera; un menor, solo las que marcó él o son suyas.
create function public.reopen_chore(p_occurrence uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  o   public.chore_occurrences := public.chore_occurrence_for_update(p_occurrence);
begin
  if o.status = 'pending' then raise exception 'This chore is not done'; end if;
  if not public.is_household_adult(o.household_id) and uid is distinct from o.done_by and uid is distinct from o.assignee_id then
    raise exception 'You can only mark your own chores';
  end if;
  update public.chore_occurrences
  set status = 'pending', done_by = null, done_at = null, approved_by = null, approved_at = null,
      reopened_by = uid, reopened_at = now()
  where id = o.id;
end $$;

-- "Me la quedo": una libre pasa a ser tuya
create function public.take_chore(p_occurrence uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences := public.chore_occurrence_for_update(p_occurrence);
begin
  if o.status <> 'pending' then raise exception 'This chore is already done'; end if;
  if o.assignee_id is not null then raise exception 'This chore already has someone'; end if;
  update public.chore_occurrences set assignee_id = (select auth.uid()), manual = true where id = o.id;
end $$;

-- Cambiar a quién le toca un día (un adulto). Sin p_user (o null) = libre.
create function public.reassign_chore(p_occurrence uuid, p_user uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences := public.chore_occurrence_for_update(p_occurrence);
begin
  if not public.is_household_adult(o.household_id) then raise exception 'Only adult members can manage chores'; end if;
  if o.status <> 'pending' then raise exception 'This chore is already done'; end if;
  if p_user is not null and not public.household_has_resident(o.household_id, p_user) then
    raise exception 'Everyone in a chore must live in the household';
  end if;
  update public.chore_occurrences set assignee_id = p_user, manual = true where id = o.id;
end $$;

-- Crea los días que faltan. La app lo llama al abrir las tareas o el hogar.
create function public.sync_chores(p_household uuid) returns integer
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_household_resident(p_household) then raise exception 'Not allowed'; end if;
  return public.chores_generate(p_household);
end $$;

-- ═════════════ 5. Cuando cambia quién está ═════════════
-- Rehace los días que vienen de las tareas por turnos de un hogar desde una fecha
create function public.chores_redo_rotations(p_household uuid, p_from date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.chores where household_id = p_household and active and assignment = 'rotation'
    order by created_at, id
  loop
    perform public.chore_reset_from(v_id, greatest(p_from, public.triqui_household_today(p_household)));
  end loop;
  perform public.chores_generate(p_household);
end $$;

-- Una ausencia nueva, cambiada o borrada rehace los turnos desde su primer día
create function public.chores_absence_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_household uuid := coalesce(new.household_id, old.household_id);
  v_from      date := least(coalesce(new.starts_on, old.starts_on), coalesce(old.starts_on, new.starts_on));
begin
  perform public.chores_redo_rotations(v_household, v_from);
  return null;
end $$;
create trigger absences_redo_chores
  after insert or update or delete on public.absences
  for each row execute function public.chores_absence_changed();

-- Quien se va sale de los turnos; sus días pendientes quedan libres (o se rehacen, si son por turnos);
-- las tareas fijas que eran suyas pasan a libres.
create function public.chores_member_left() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.chore_rotation r
  using public.chores c
  where c.id = r.chore_id and c.household_id = new.household_id and r.user_id = new.user_id;
  update public.chores set assignment = 'free', assignee_id = null
  where household_id = new.household_id and assignment = 'fixed' and assignee_id = new.user_id;
  perform public.chores_redo_rotations(new.household_id, public.triqui_household_today(new.household_id));
  update public.chore_occurrences set assignee_id = null
  where household_id = new.household_id and assignee_id = new.user_id and status = 'pending';
  return new;
end $$;
create trigger household_members_left_chores
  after update of left_at on public.household_members
  for each row when (old.left_at is null and new.left_at is not null)
  execute function public.chores_member_left();

-- ═════════════ 6. Permisos de ejecución ═════════════
revoke execute on function public.household_has_resident(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.chore_is_absent(uuid, uuid, date) from public, anon, authenticated;
revoke execute on function public.chore_occurs_on(public.chore_frequency, integer, smallint[], date, date) from public, anon, authenticated;
revoke execute on function public.chore_pick_rotation(uuid, uuid, date) from public, anon, authenticated;
revoke execute on function public.chores_generate(uuid) from public, anon, authenticated;
revoke execute on function public.chore_reset_from(uuid, date) from public, anon, authenticated;
revoke execute on function public.chore_check(uuid, public.chore_frequency, integer[], date, public.chore_assignment, uuid[], boolean) from public, anon, authenticated;
revoke execute on function public.chore_occurrence_for_update(uuid) from public, anon, authenticated;
revoke execute on function public.chores_redo_rotations(uuid, date) from public, anon, authenticated;
revoke execute on function public.chores_absence_changed() from public, anon, authenticated;
revoke execute on function public.chores_member_left() from public, anon, authenticated;

revoke execute on function public.create_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text) from public, anon;
revoke execute on function public.update_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text) from public, anon;
revoke execute on function public.delete_chore(uuid) from public, anon;
revoke execute on function public.complete_chore(uuid) from public, anon;
revoke execute on function public.approve_chore(uuid) from public, anon;
revoke execute on function public.reopen_chore(uuid) from public, anon;
revoke execute on function public.take_chore(uuid) from public, anon;
revoke execute on function public.reassign_chore(uuid, uuid) from public, anon;
revoke execute on function public.sync_chores(uuid) from public, anon;

grant execute on function public.create_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text) to authenticated;
grant execute on function public.update_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text) to authenticated;
grant execute on function public.delete_chore(uuid) to authenticated;
grant execute on function public.complete_chore(uuid) to authenticated;
grant execute on function public.approve_chore(uuid) to authenticated;
grant execute on function public.reopen_chore(uuid) to authenticated;
grant execute on function public.take_chore(uuid) to authenticated;
grant execute on function public.reassign_chore(uuid, uuid) to authenticated;
grant execute on function public.sync_chores(uuid) to authenticated;
