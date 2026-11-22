-- Migración 31: tareas semanales o mensuales que se hacen una vez, cualquier día de la semana o del mes.
--
-- chores.anytime marca estas tareas (solo semanal o mensual; en semanal no lleva días de la semana).
-- Cada vez que toca, la fila de chore_occurrences va de due_on (inicio del plazo: el lunes o el día 1, o el
-- primer día de la tarea si empieza a mitad) a due_by (fecha límite: el domingo o el último día del mes).
-- En las tareas de un día concreto, due_by = due_on. Atrasada pasa a ser "due_by < hoy".
-- Con turnos, a cada plazo le toca a una persona; se salta a quien esté de ausencia todo el plazo.

-- ═════════════ 1. Columnas ═════════════
alter table public.chores add column anytime boolean not null default false;
alter table public.chores add constraint chores_anytime_kind check (not anytime or frequency in ('weekly', 'monthly'));
alter table public.chores drop constraint chores_weekdays_valid;
alter table public.chores add constraint chores_weekdays_valid check (
  ((frequency = 'weekly' and not anytime) = (weekdays is not null))
  and (weekdays is null or (cardinality(weekdays) between 1 and 7 and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]))
);

-- Fecha límite (en los días sueltos, el mismo día)
alter table public.chore_occurrences add column due_by date;
update public.chore_occurrences set due_by = due_on;
alter table public.chore_occurrences alter column due_by set not null;
alter table public.chore_occurrences add constraint chore_occurrences_due_by_order check (due_by >= due_on);

-- ═════════════ 2. Plazos ═════════════
-- Primer día del plazo que contiene p_day (el lunes o el día 1). Sin plazo, el mismo día.
create function public.chore_period_start(p_frequency public.chore_frequency, p_anytime boolean, p_day date)
returns date
language sql immutable set search_path = '' as $$
  select case
    when p_anytime and p_frequency = 'weekly' then p_day - (extract(isodow from p_day)::integer - 1)
    when p_anytime and p_frequency = 'monthly' then date_trunc('month', p_day::timestamp)::date
    else p_day
  end;
$$;

-- Último día del plazo que contiene p_day (el domingo o el último del mes). Sin plazo, el mismo día.
create function public.chore_period_end(p_frequency public.chore_frequency, p_anytime boolean, p_day date)
returns date
language sql immutable set search_path = '' as $$
  select case
    when p_anytime and p_frequency = 'weekly' then p_day + (7 - extract(isodow from p_day)::integer)
    when p_anytime and p_frequency = 'monthly' then (date_trunc('month', p_day::timestamp) + interval '1 month - 1 day')::date
    else p_day
  end;
$$;

-- ¿Toca la tarea ese día? Con plazo, "toca" el primer día de cada plazo (o el primer día de la tarea).
drop function public.chore_occurs_on(public.chore_frequency, integer, smallint[], date, date);
create function public.chore_occurs_on(
  p_frequency public.chore_frequency, p_interval integer, p_weekdays smallint[], p_starts date, p_day date,
  p_anytime boolean
) returns boolean
language sql immutable set search_path = '' as $$
  select p_day >= p_starts and case p_frequency
    when 'once' then p_day = p_starts
    when 'daily' then (p_day - p_starts) % p_interval = 0
    when 'weekly' then
      (case when p_anytime then extract(isodow from p_day) = 1 or p_day = p_starts
            else extract(isodow from p_day)::smallint = any (p_weekdays) end)
      -- semanas enteras entre el lunes de ese día y el lunes del primer día
      and ((p_day - (extract(isodow from p_day)::integer - 1)) - (p_starts - (extract(isodow from p_starts)::integer - 1))) / 7
          % p_interval = 0
    when 'monthly' then
      ((extract(year from p_day) - extract(year from p_starts)) * 12
        + extract(month from p_day) - extract(month from p_starts))::integer % p_interval = 0
      and (case when p_anytime then extract(day from p_day) = 1 or p_day = p_starts
           -- el mismo día del mes que el primero (o el último del mes si ese día no existe: 31 → 28 feb)
           else (p_starts + make_interval(months => ((extract(year from p_day) - extract(year from p_starts)) * 12
                  + extract(month from p_day) - extract(month from p_starts))::integer))::date = p_day end)
  end;
$$;

-- ¿Está esa persona de ausencia todos los días de p_from a p_until (una sola ausencia que lo cubre)?
create function public.chore_is_absent_during(p_household uuid, p_user uuid, p_from date, p_until date)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.absences a
    where a.household_id = p_household and a.user_id = p_user and a.starts_on <= p_from and p_until <= a.ends_on
  );
$$;

-- Turnos (como en la migración 12), pero la ausencia se mira en todo el plazo (de p_day a p_until)
drop function public.chore_pick_rotation(uuid, uuid, date);
create function public.chore_pick_rotation(
  p_chore uuid, p_household uuid, p_day date, p_until date,
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
    and not public.chore_is_absent_during(p_household, r.user_id, p_day, p_until)
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
    if public.chore_is_absent_during(p_household, m.user_id, p_day, p_until) then
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

-- Crea los días de las tareas activas de un hogar hasta dentro de dos semanas (como en la migración 12).
-- Las de plazo miran desde el inicio del plazo en curso, para que se cree aunque ya haya empezado
-- (al editarla o si nadie abrió la app); el "not exists" evita repetirlas.
create or replace function public.chores_generate(p_household uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_today date;
  v_until date;
  c       public.chores;
  v_day   date;
  v_by    date;
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
      if c.anytime then
        v_day := greatest(c.starts_on, public.chore_period_start(c.frequency, true, v_today));
      else
        -- Lo que ya pasó sin que nadie abriera la app no se crea
        v_day := greatest(coalesce(c.generated_until + 1, c.starts_on), c.starts_on, v_today);
      end if;
      while v_day <= v_until loop
        v_by := public.chore_period_end(c.frequency, c.anytime, v_day);
        -- Si ya hay algo de esta tarea dentro del plazo (p. ej. el martes ya hecho antes de pasarla a
        -- "cualquier día"), ese plazo no se crea otra vez
        if public.chore_occurs_on(c.frequency, c.interval_count, c.weekdays, c.starts_on, v_day, c.anytime)
           and not exists (select 1 from public.chore_occurrences o
                           where o.chore_id = c.id and o.due_on between v_day and v_by) then
          if c.assignment = 'rotation' then
            select * into v_pick from public.chore_pick_rotation(c.id, p_household, v_day, v_by);
            insert into public.chore_occurrences (chore_id, household_id, due_on, due_by, assignee_id, pointer_before,
                                                  skipped_users, repaid_user)
            values (c.id, p_household, v_day, v_by, v_pick.assignee, v_pick.pointer_before, v_pick.skipped,
                    v_pick.repaid);
          else
            insert into public.chore_occurrences (chore_id, household_id, due_on, due_by, assignee_id)
            values (c.id, p_household, v_day, v_by,
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

-- Deshace lo pendiente desde p_from (como en la migración 12), pero mirando la fecha límite: un plazo que ya
-- empezó y sigue abierto también se rehace (al editar la tarea, con una ausencia o si alguien se va).
create or replace function public.chore_reset_from(p_chore uuid, p_from date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.chore_occurrences;
begin
  for o in
    select * from public.chore_occurrences
    where chore_id = p_chore and due_by >= p_from and status = 'pending' and not manual
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

-- ═════════════ 3. Crear y cambiar tareas ═════════════
-- Como en la migración 12, más p_anytime: con plazo no se piden días de la semana (devuelve null)
drop function public.chore_check(uuid, public.chore_frequency, integer[], date, public.chore_assignment, uuid[], boolean);
create function public.chore_check(
  p_household uuid, p_frequency public.chore_frequency, p_weekdays integer[], p_starts_on date,
  p_assignment public.chore_assignment, p_people uuid[], p_check_start boolean, p_anytime boolean
) returns smallint[]
language plpgsql stable security definer set search_path = '' as $$
declare
  v_today date := public.triqui_household_today(p_household);
  v_days  smallint[];
begin
  if p_frequency is null or p_assignment is null or p_anytime is null then raise exception 'Invalid chore'; end if;
  if p_anytime and p_frequency not in ('weekly', 'monthly') then raise exception 'Invalid chore'; end if;
  if p_check_start and (p_starts_on is null or p_starts_on < v_today or p_starts_on > v_today + 366) then
    raise exception 'Invalid start date';
  end if;

  if p_frequency = 'weekly' and not p_anytime then
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

-- Crear una tarea (como en la migración 12, más p_anytime al final)
drop function public.create_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text);
create function public.create_chore(
  p_household uuid, p_title text, p_effort integer, p_frequency public.chore_frequency, p_interval integer,
  p_weekdays integer[], p_starts_on date, p_assignment public.chore_assignment, p_people uuid[],
  p_requires_approval boolean default false, p_notes text default null, p_anytime boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_days smallint[];
  v_id   uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can manage chores'; end if;
  v_days := public.chore_check(p_household, p_frequency, p_weekdays, p_starts_on, p_assignment, p_people, true,
                               coalesce(p_anytime, false));

  insert into public.chores (household_id, title, notes, effort, frequency, interval_count, weekdays, anytime, starts_on,
                             assignment, assignee_id, requires_approval, created_by)
  values (p_household, btrim(p_title), nullif(btrim(p_notes), ''), coalesce(p_effort, 2), p_frequency,
          coalesce(p_interval, 1), v_days, coalesce(p_anytime, false), p_starts_on, p_assignment,
          case when p_assignment = 'fixed' then p_people[1] end, coalesce(p_requires_approval, false), uid)
  returning id into v_id;

  if p_assignment = 'rotation' then
    insert into public.chore_rotation (chore_id, user_id, position)
    select v_id, x, (n - 1)::integer from unnest(p_people) with ordinality as t(x, n);
  end if;

  perform public.chores_generate(p_household);
  return v_id;
end $$;

-- Cambiar una tarea (como en la migración 12, más p_anytime al final). Lo pendiente que sigue cuadrando
-- con la tarea nueva se queda, con la fecha límite nueva (p. ej. lo del lunes pasa a ser el plazo de la semana).
drop function public.update_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text);
create function public.update_chore(
  p_chore uuid, p_title text, p_effort integer, p_frequency public.chore_frequency, p_interval integer,
  p_weekdays integer[], p_starts_on date, p_assignment public.chore_assignment, p_people uuid[],
  p_requires_approval boolean default false, p_notes text default null, p_anytime boolean default false
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c         public.chores;
  v_days    smallint[];
  v_today   date;
  v_owed    uuid[];
  v_anytime boolean := coalesce(p_anytime, false);
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into c from public.chores where id = p_chore and active for update;
  if not found or not public.is_household_adult(c.household_id) then raise exception 'Only adult members can manage chores'; end if;
  v_days := public.chore_check(c.household_id, p_frequency, p_weekdays, p_starts_on, p_assignment, p_people,
                               p_starts_on is distinct from c.starts_on, v_anytime);
  v_today := public.triqui_household_today(c.household_id);

  -- Primero se deshace lo que viene (con los turnos de antes)
  perform public.chore_reset_from(p_chore, v_today);

  update public.chores
  set title = btrim(p_title), notes = nullif(btrim(p_notes), ''), effort = coalesce(p_effort, 2),
      frequency = p_frequency, interval_count = coalesce(p_interval, 1), weekdays = v_days, anytime = v_anytime,
      starts_on = p_starts_on, assignment = p_assignment,
      assignee_id = case when p_assignment = 'fixed' then p_people[1] end,
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
  where o.chore_id = p_chore and o.status = 'pending' and o.due_by >= v_today
    and not public.chore_occurs_on(p_frequency, coalesce(p_interval, 1), v_days, p_starts_on, o.due_on, v_anytime);

  -- Si deja de ser "cualquier día", los plazos abiertos que queden (cambiados a mano) se quitan: no se
  -- convierten en un día que ya ha pasado
  if not v_anytime then
    delete from public.chore_occurrences o
    where o.chore_id = p_chore and o.status = 'pending' and o.due_by > o.due_on and o.due_by >= v_today;
  end if;

  -- Lo pendiente que sí cuadra toma la fecha límite nueva (también lo de este plazo que ya se había pasado)
  update public.chore_occurrences o
  set due_by = public.chore_period_end(p_frequency, v_anytime, o.due_on)
  where o.chore_id = p_chore and o.status = 'pending'
    and public.chore_occurs_on(p_frequency, coalesce(p_interval, 1), v_days, p_starts_on, o.due_on, v_anytime)
    and (o.due_by >= v_today or o.due_on >= public.chore_period_start(p_frequency, v_anytime, v_today))
    and o.due_by is distinct from public.chore_period_end(p_frequency, v_anytime, o.due_on);

  perform public.chores_generate(c.household_id);
end $$;

-- ═════════════ 4. Avisos ═════════════
-- Como en la migración de avisos, más la fecha límite en los datos del aviso
create or replace function public.chores_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_title text;
  v_url   text := '/hogar/' || new.household_id || '/tareas/dia/' || new.id;
  v_data  jsonb;
  a       uuid;
begin
  select title into v_title from public.chores where id = new.chore_id;
  v_data := jsonb_build_object('title', v_title, 'due_on', new.due_on, 'due_by', new.due_by);

  -- Te han pasado un día (a mano)
  if new.manual and new.assignee_id is not null and new.assignee_id is distinct from old.assignee_id then
    perform public.notify(new.assignee_id, new.household_id, 'chore_reassigned', uid, new.id, v_data, v_url,
      'chore-reassigned:' || new.id || ':' || new.assignee_id);
  end if;

  -- "No está hecha": a quien le tocaba y a quien la marcó
  if old.status <> 'pending' and new.status = 'pending' then
    perform public.notify(new.assignee_id, new.household_id, 'chore_reopened', uid, new.id, v_data, v_url,
      'chore-reopened:' || new.id || ':' || new.reopened_at);
    if old.done_by is distinct from new.assignee_id then
      perform public.notify(old.done_by, new.household_id, 'chore_reopened', uid, new.id, v_data, v_url,
        'chore-reopened:' || new.id || ':' || new.reopened_at);
    end if;
  end if;

  -- Un menor la marca y espera el visto bueno: a sus tutores del hogar (si no tiene, a todos los adultos)
  if old.status = 'pending' and new.status = 'review' then
    for a in
      with adults as (
        select m.user_id from public.household_members m
        where m.household_id = new.household_id and m.role in ('admin', 'member') and m.left_at is null
      ),
      guardians as (
        select g.guardian_id as user_id from public.guardianships g
        where g.minor_id = new.done_by and g.guardian_id in (select user_id from adults)
      )
      select user_id from guardians
      union
      select user_id from adults where not exists (select 1 from guardians)
    loop
      perform public.notify(a, new.household_id, 'chore_to_approve', uid, new.id, v_data, v_url,
        'chore-review:' || new.id || ':' || new.done_at);
    end loop;
  end if;

  -- Sale de "esperando visto bueno" (dado o reabierto): el aviso queda leído para todos
  if old.status = 'review' and new.status <> 'review' then
    perform public.notifications_resolve('chore_to_approve', new.id);
  end if;

  -- Visto bueno: a quien la hizo
  if old.status = 'review' and new.status = 'done' then
    perform public.notify(new.done_by, new.household_id, 'chore_approved', uid, new.id, v_data, v_url,
      'chore-approved:' || new.id || ':' || new.approved_at);
  end if;
  return null;
end $$;

-- ═════════════ 5. Permisos de ejecución ═════════════
revoke execute on function public.chore_period_start(public.chore_frequency, boolean, date) from public, anon, authenticated;
revoke execute on function public.chore_period_end(public.chore_frequency, boolean, date) from public, anon, authenticated;
revoke execute on function public.chore_occurs_on(public.chore_frequency, integer, smallint[], date, date, boolean) from public, anon, authenticated;
revoke execute on function public.chore_is_absent_during(uuid, uuid, date, date) from public, anon, authenticated;
revoke execute on function public.chore_pick_rotation(uuid, uuid, date, date) from public, anon, authenticated;
revoke execute on function public.chore_check(uuid, public.chore_frequency, integer[], date, public.chore_assignment, uuid[], boolean, boolean) from public, anon, authenticated;

revoke execute on function public.create_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text, boolean) from public, anon;
revoke execute on function public.update_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text, boolean) from public, anon;
grant execute on function public.create_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text, boolean) to authenticated;
grant execute on function public.update_chore(uuid, text, integer, public.chore_frequency, integer, integer[], date, public.chore_assignment, uuid[], boolean, text, boolean) to authenticated;
