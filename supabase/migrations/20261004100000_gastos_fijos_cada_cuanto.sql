-- HAPPA · Migración 10: gastos fijos cada N semanas, meses o años
--
-- Hasta ahora un gasto fijo era semanal, mensual o anual. Ahora además guarda CADA CUÁNTOS: cada 2 semanas,
-- cada 2 meses (bimestral), cada 3 (trimestral), cada 6 (semestral)... La app ofrece las opciones
-- habituales; la base de datos admite de 1 a 12.
--   · Las fechas se siguen contando desde el primer cargo: trimestral desde el 31 de enero → 30 de abril,
--     31 de julio, 31 de octubre...
--   · Cada cuánto se cobra, como el primer cargo, solo se puede cambiar mientras no haya cargos apuntados.
--   · Los gastos fijos que ya existen se quedan como estaban (cada 1).

-- ═════════════ 1. Columna nueva ═════════════
alter table public.recurring_expenses
  add column interval_count integer not null default 1
  constraint recurring_interval_range check (interval_count between 1 and 12);

-- ═════════════ 2. Fechas, ahora con "cada cuántos" ═════════════
-- Se borran y se vuelven a crear con un dato más (que, si no se indica, vale 1).
-- Las funciones que las usan se rehacen más abajo.
drop function public.recurring_charge_date(date, public.recurring_frequency, integer);
drop function public.recurring_first_from(date, public.recurring_frequency, integer, date);

-- Fecha del cargo número n (empezando en 0), contada desde el primer cargo
create function public.recurring_charge_date(
  p_start date, p_frequency public.recurring_frequency, p_n integer, p_interval integer default 1
) returns date
language sql immutable set search_path = '' as $$
  select case p_frequency
    when 'weekly'  then p_start + 7 * p_n * p_interval
    when 'monthly' then (p_start + make_interval(months => p_n * p_interval))::date
    when 'yearly'  then (p_start + make_interval(years => p_n * p_interval))::date
  end;
$$;

-- Primer número de cargo (desde p_n) cuya fecha es p_from o después. Sirve para saltarse lo que tocó
-- mientras un gasto fijo estaba parado.
create function public.recurring_first_from(
  p_start date, p_frequency public.recurring_frequency, p_n integer, p_from date, p_interval integer default 1
) returns integer
language plpgsql immutable set search_path = '' as $$
declare
  v_n integer := p_n;
begin
  while public.recurring_charge_date(p_start, p_frequency, v_n, p_interval) < p_from loop
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ═════════════ 3. Funciones internas que cuentan fechas (igual que en la migración 9, con el intervalo) ═════════════
-- Si ya han confirmado todos los que participan, el gasto fijo pasa a confirmado.
-- Si ya había estado confirmado antes (vuelve a funcionar tras pararse), sigue desde hoy.
create or replace function public.recurring_refresh_status(p_recurring uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r   public.recurring_expenses;
  v_n integer;
begin
  select * into r from public.recurring_expenses where id = p_recurring and status = 'pending';
  if not found then return; end if;
  if exists (
    select 1
    from (
      select r.paid_by as user_id
      union
      select user_id from public.recurring_expense_shares where recurring_id = p_recurring
    ) p
    where not exists (
      select 1 from public.recurring_expense_confirmations c
      where c.recurring_id = p_recurring and c.user_id = p.user_id
    )
  ) then
    return;
  end if;

  v_n := r.charges_made;
  if r.first_confirmed_at is not null then
    v_n := public.recurring_first_from(r.starts_on, r.frequency, r.charges_made,
                                       public.triqui_household_today(r.household_id), r.interval_count);
  end if;
  update public.recurring_expenses
  set status = 'confirmed', confirmed_at = now(), first_confirmed_at = coalesce(first_confirmed_at, now()),
      charges_made = v_n,
      next_charge_on = public.recurring_charge_date(starts_on, frequency, v_n, interval_count)
  where id = p_recurring;
end $$;

-- Apunta los cargos que tocan (hasta hoy) de los gastos fijos confirmados y activos de un hogar.
-- Devuelve cuántos ha apuntado. Como mucho 100 por vez (el resto, la próxima).
-- Si un gasto fijo diera un error, se salta (queda en el registro de Supabase) y siguen los demás.
create or replace function public.recurring_generate(p_household uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_today  date;
  r        public.recurring_expenses;
  v_n      integer;
  v_date   date;
  v_shares jsonb;
  v_id     uuid;
  v_made   integer := 0;
  v_here   integer;
begin
  -- Los hogares archivados no apuntan nada
  select (now() at time zone h.timezone)::date into v_today
  from public.households h where h.id = p_household and h.archived_at is null;
  if v_today is null then return 0; end if;

  for r in
    select * from public.recurring_expenses
    where household_id = p_household and status = 'confirmed' and active and next_charge_on <= v_today
    order by next_charge_on, id
    for update skip locked
  loop
    begin
      v_here := 0;
      v_n := r.charges_made;
      loop
        v_date := public.recurring_charge_date(r.starts_on, r.frequency, v_n, r.interval_count);
        exit when v_date > v_today or v_made + v_here >= 100;

        -- Se reparte entre quienes siguen viviendo aquí
        select jsonb_agg(jsonb_build_object('user_id', s.user_id, 'weight', s.weight) order by s.user_id)
        into v_shares
        from public.recurring_expense_shares s
        where s.recurring_id = r.id and public.triqui_is_current_adult(p_household, s.user_id);

        -- Si quien paga ya no vive aquí, o no queda nadie en el reparto, ese cargo no se cobra a nadie
        if v_shares is not null and public.triqui_is_current_adult(p_household, r.paid_by) then
          insert into public.expenses (household_id, description, amount_cents, spent_on, split_method,
                                       source, status, confirmed_at, recurring_id, recurring_charge)
          values (p_household, r.description, r.amount_cents, v_date, r.split_method,
                  'recurring', 'confirmed', now(), r.id, v_n + 1)
          on conflict (recurring_id, recurring_charge) do nothing
          returning id into v_id;

          if v_id is not null then
            insert into public.expense_payers (expense_id, user_id, amount_cents) values (v_id, r.paid_by, r.amount_cents);
            insert into public.expense_shares (expense_id, user_id, weight, amount_cents)
            select v_id, s.user_id, s.weight, s.amount_cents from public.triqui_split(r.amount_cents, r.split_method, v_shares) s;
            -- Todos los que participan ya lo confirmaron al aceptar el gasto fijo
            insert into public.expense_confirmations (expense_id, user_id)
            select v_id, p.user_id from (
              select user_id from public.expense_payers where expense_id = v_id
              union
              select user_id from public.expense_shares where expense_id = v_id
            ) p;
            v_here := v_here + 1;
          end if;
        end if;
        v_n := v_n + 1;
      end loop;

      if v_n <> r.charges_made then
        update public.recurring_expenses
        set charges_made = v_n,
            next_charge_on = public.recurring_charge_date(r.starts_on, r.frequency, v_n, r.interval_count)
        where id = r.id;
      end if;
      v_made := v_made + v_here;
    exception when others then
      raise warning 'Gasto fijo % sin poner al día: %', r.id, sqlerrm;
    end;
  end loop;
  return v_made;
end $$;

-- ═════════════ 4. Funciones de la app (RPC) con "cada cuántos" ═════════════
-- Crear y editar cambian de forma (un dato más), así que se borran y se vuelven a crear.
drop function public.create_recurring_expense(uuid, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb);
drop function public.update_recurring_expense(uuid, integer, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb);

-- p_interval: cada cuántas semanas, meses o años (1 si no se indica)
create function public.create_recurring_expense(
  p_household uuid, p_description text, p_amount_cents integer, p_frequency public.recurring_frequency,
  p_starts_on date, p_paid_by uuid, p_split_method public.expense_split_method, p_shares jsonb,
  p_interval integer default 1
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  v_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can add expenses'; end if;
  perform public.recurring_check_start(p_starts_on, public.triqui_household_today(p_household));

  insert into public.recurring_expenses (household_id, description, amount_cents, frequency, interval_count,
                                         starts_on, next_charge_on, paid_by, split_method, created_by, updated_by)
  values (p_household, btrim(p_description), p_amount_cents, p_frequency, p_interval,
          p_starts_on, p_starts_on, p_paid_by, p_split_method, uid, uid)
  returning id into v_id;

  perform public.recurring_save_parts(v_id, p_household, p_amount_cents, p_split_method, p_paid_by, p_shares);

  -- Quien lo crea ya lo da por bueno (si participa)
  insert into public.recurring_expense_confirmations (recurring_id, user_id)
  select v_id, uid where public.recurring_is_participant(v_id, uid);
  perform public.recurring_refresh_status(v_id);
  -- Si ya está confirmado (solo participa quien lo crea) y el primer cargo es hoy o antes, se apunta ya
  perform public.recurring_generate(p_household);
  return v_id;
end $$;

-- Editar. Las reglas son las de la migración 9. p_interval: cada cuántos (si no se indica, el que tenía).
-- Cuándo se cobra (primer cargo, cada cuánto y cada cuántos) solo se puede cambiar mientras no haya cargos.
create function public.update_recurring_expense(
  p_recurring uuid, p_version integer, p_description text, p_amount_cents integer,
  p_frequency public.recurring_frequency, p_starts_on date, p_paid_by uuid,
  p_split_method public.expense_split_method, p_shares jsonb, p_interval integer default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid            uuid := (select auth.uid());
  r              public.recurring_expenses;
  v_interval     integer;
  v_new_schedule boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.recurring_expenses where id = p_recurring for update;
  if not found then raise exception 'Expense not found'; end if;
  if not (public.is_household_admin(r.household_id)
          or (r.first_confirmed_at is null and r.created_by = uid and public.is_household_adult(r.household_id))) then
    raise exception 'You cannot change this expense';
  end if;
  if p_version is distinct from r.version then raise exception 'Expense changed'; end if;

  -- Los cargos que ya tocaban se apuntan con las condiciones de antes
  perform public.recurring_generate(r.household_id);
  select * into r from public.recurring_expenses where id = p_recurring;

  v_interval := coalesce(p_interval, r.interval_count);
  v_new_schedule := p_frequency is distinct from r.frequency or p_starts_on is distinct from r.starts_on
                    or v_interval <> r.interval_count;
  if v_new_schedule then
    if public.recurring_has_charges(p_recurring) then
      raise exception 'The schedule cannot change after the first charge';
    end if;
    perform public.recurring_check_start(p_starts_on, public.triqui_household_today(r.household_id));
  end if;

  update public.recurring_expenses
  set description = btrim(p_description), amount_cents = p_amount_cents, frequency = p_frequency,
      interval_count = v_interval, starts_on = p_starts_on,
      -- Con calendario nuevo (aún sin cargos) se empieza a contar desde el nuevo primer cargo
      charges_made = case when v_new_schedule then 0 else charges_made end,
      next_charge_on = case when v_new_schedule then p_starts_on else next_charge_on end,
      paid_by = p_paid_by, split_method = p_split_method, updated_by = uid, version = version + 1
  where id = p_recurring;

  perform public.recurring_save_parts(p_recurring, r.household_id, p_amount_cents, p_split_method, p_paid_by, p_shares);

  if r.first_confirmed_at is not null then
    -- Ya funcionaba (edita un admin): se quedan las confirmaciones de quien sigue participando
    delete from public.recurring_expense_confirmations c
    where c.recurring_id = p_recurring and not public.recurring_is_participant(p_recurring, c.user_id);
    -- Quien edita lo da por bueno (si participa)
    insert into public.recurring_expense_confirmations (recurring_id, user_id)
    select p_recurring, uid where public.recurring_is_participant(p_recurring, uid)
    on conflict do nothing;
    update public.recurring_expenses set status = 'pending', confirmed_at = null, rejected_by = null,
      rejected_reason = null
    where id = p_recurring;
    perform public.recurring_refresh_status(p_recurring);
    -- Si nadie nuevo tiene que confirmar, sigue confirmado desde cuando lo estaba
    update public.recurring_expenses set confirmed_at = r.confirmed_at
    where id = p_recurring and status = 'confirmed' and r.confirmed_at is not null;
  else
    delete from public.recurring_expense_confirmations where recurring_id = p_recurring;
    update public.recurring_expenses set status = 'pending', rejected_by = null, rejected_reason = null
    where id = p_recurring;
    insert into public.recurring_expense_confirmations (recurring_id, user_id)
    select p_recurring, uid where public.recurring_is_participant(p_recurring, uid);
    perform public.recurring_refresh_status(p_recurring);
  end if;
  perform public.recurring_generate(r.household_id);
end $$;

-- Pausar o reanudar: un admin o quien paga. Al pausar, antes se apunta lo que ya tocaba.
-- Al reanudar, se salta lo que tocó mientras estaba parado: el próximo cargo es hoy o después.
create or replace function public.set_recurring_expense_active(p_recurring uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  r       public.recurring_expenses;
  v_n     integer;
  v_today date;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.recurring_expenses where id = p_recurring for update;
  if not found or not (public.is_household_admin(r.household_id)
                       or (r.paid_by = uid and public.is_household_adult(r.household_id))) then
    raise exception 'You cannot change this expense';
  end if;
  if p_active is null or p_active = r.active then return; end if;

  if not p_active then
    perform public.recurring_generate(r.household_id);
    update public.recurring_expenses set active = false, updated_by = uid where id = p_recurring;
    return;
  end if;

  v_today := public.triqui_household_today(r.household_id);
  v_n := public.recurring_first_from(r.starts_on, r.frequency, r.charges_made, v_today, r.interval_count);
  update public.recurring_expenses
  set active = true, charges_made = v_n,
      next_charge_on = public.recurring_charge_date(r.starts_on, r.frequency, v_n, r.interval_count),
      updated_by = uid
  where id = p_recurring;
  perform public.recurring_generate(r.household_id);
end $$;

-- ═════════════ 5. Permisos de ejecución ═════════════
-- Las internas no se pueden llamar desde la app; crear y editar, solo con sesión.
-- (Las funciones rehechas con "create or replace" conservan los permisos que tenían.)
revoke execute on function public.recurring_charge_date(date, public.recurring_frequency, integer, integer) from public, anon, authenticated;
revoke execute on function public.recurring_first_from(date, public.recurring_frequency, integer, date, integer) from public, anon, authenticated;

revoke execute on function public.create_recurring_expense(uuid, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb, integer) from public, anon;
revoke execute on function public.update_recurring_expense(uuid, integer, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb, integer) from public, anon;
grant execute on function public.create_recurring_expense(uuid, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb, integer) to authenticated;
grant execute on function public.update_recurring_expense(uuid, integer, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb, integer) to authenticated;
