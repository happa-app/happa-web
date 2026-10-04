-- HAPPA · Migración 9: Gastos — de la compra a un gasto, y gastos fijos que se apuntan solos
--
-- En la app esta parte se llama ahora "Gastos" (antes "triqui"). Por dentro, las tablas y funciones
-- de la migración 8 conservan sus nombres (triqui_*, expenses...): nadie los ve y cambiarlos solo
-- obligaría a rehacerlo todo.
--
-- 1) De la lista de la compra a un gasto
--    · Desde la lista común del hogar, un adulto elige productos ya comprados y apunta lo que costó.
--    · Se crea un gasto normal (mismas reglas: reparto, confirmaciones...) que guarda la lista de
--      productos, y esos productos salen de la lista de la compra. O se hace todo o no se hace nada.
--
-- 2) Gastos fijos (suscripciones, internet, luz...)
--    · Se apuntan una vez: concepto, importe, cada cuánto (semana, mes o año), primer cargo,
--      quién paga y entre quiénes se reparte (a partes iguales o por partes).
--    · Lo confirman UNA vez todos los que participan. Desde entonces, cada vez que toca, el gasto se
--      apunta solo y ya confirmado (no hay que confirmar cada mes).
--    · Antes de confirmarse por primera vez lo edita o borra quien lo creó (o un admin); después, solo
--      un admin, como los gastos. Si un admin añade a alguien nuevo, se para hasta que esa persona lo
--      confirme.
--    · Lo pueden pausar un admin o quien paga.
--    · Lo de atrás solo se cobra la primera vez: al confirmarse por primera vez se apuntan los cargos
--      que ya tocaban desde el primer cargo. Si después se para (pausa, alguien nuevo que confirmar,
--      se fue quien paga) y vuelve a funcionar, sigue desde hoy: lo que tocó mientras estaba parado
--      no se cobra a nadie.
--    · Quien se va del hogar sale de todos sus gastos fijos (antes se apunta lo que ya tocaba con esa
--      persona dentro). Si vuelve, un admin tiene que añadirla y ella confirmarlo. Si se va quien paga,
--      el gasto fijo se para hasta que un admin cambie quién paga y esa persona lo confirme.
--    · Los cargos se apuntan al abrir la app (gastos u hogar): se ponen al día todos los que tocaban.
--      Antes de editar, pausar o borrar un gasto fijo, se apuntan los cargos que ya tocaban.
--    · Las fechas se cuentan siempre desde el primer cargo: si empieza el 31, los meses cortos se
--      cobran el último día (28 feb, 31 mar...).

-- ═════════════ 1. Productos de un gasto que viene de la compra ═════════════
create table public.expense_items (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  position   integer not null,
  name       text not null constraint expense_items_name_length check (char_length(name) between 1 and 80),
  quantity   integer not null default 1 constraint expense_items_quantity_range check (quantity between 1 and 99),
  primary key (expense_id, position)
);

revoke all on public.expense_items from anon, authenticated;
grant select on public.expense_items to authenticated;
alter table public.expense_items enable row level security;
-- Los productos de los gastos que ya puedes ver
create policy "expense_items_select" on public.expense_items for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id));

-- ═════════════ 2. Gastos fijos: tablas ═════════════
create type public.recurring_frequency as enum ('weekly', 'monthly', 'yearly');

create table public.recurring_expenses (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households (id) on delete cascade,
  description     text not null
                  constraint recurring_description_length check (char_length(description) between 1 and 80),
  amount_cents    integer not null
                  constraint recurring_amount_range check (amount_cents between 1 and 10000000),
  frequency       public.recurring_frequency not null,
  -- Primer cargo. Los siguientes se cuentan siempre desde aquí (así el día 31 no se va moviendo).
  starts_on       date not null,
  paid_by         uuid not null references public.profiles (id),
  split_method    public.expense_split_method not null
                  constraint recurring_split_method check (split_method in ('equal', 'shares')),
  status          public.triqui_status not null default 'pending',
  -- Sube cada vez que se edita (como en los gastos)
  version         integer not null default 1,
  -- false = pausado
  active          boolean not null default true,
  -- Cuántos cargos se han apuntado ya (o saltado por una pausa) y cuándo toca el siguiente
  charges_made    integer not null default 0,
  next_charge_on  date not null,
  created_by      uuid references public.profiles (id) on delete set null,
  updated_by      uuid,
  rejected_by     uuid,
  rejected_reason text constraint recurring_rejected_reason_length check (char_length(rejected_reason) <= 200),
  confirmed_at    timestamptz,
  -- La primera vez que quedó confirmado. Desde entonces: solo un admin lo edita, y si se para y
  -- vuelve a funcionar, no se cobra lo de atrás.
  first_confirmed_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index recurring_expenses_household_idx on public.recurring_expenses (household_id, next_charge_on);
create index recurring_expenses_paid_by_idx on public.recurring_expenses (paid_by);
create index recurring_expenses_created_by_idx on public.recurring_expenses (created_by);
create trigger recurring_expenses_updated_at before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- Entre quiénes se reparte (weight: las partes, solo en el reparto "por partes")
create table public.recurring_expense_shares (
  recurring_id uuid not null references public.recurring_expenses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id),
  weight       integer constraint recurring_shares_weight_range check (weight between 1 and 99),
  primary key (recurring_id, user_id)
);
create index recurring_expense_shares_user_idx on public.recurring_expense_shares (user_id);

-- Quién ha dado el gasto fijo por bueno
create table public.recurring_expense_confirmations (
  recurring_id uuid not null references public.recurring_expenses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id),
  confirmed_at timestamptz not null default now(),
  primary key (recurring_id, user_id)
);
create index recurring_expense_confirmations_user_idx on public.recurring_expense_confirmations (user_id);

-- Cada cargo apuntado sabe de qué gasto fijo viene y qué número de cargo es (1, 2, 3...).
-- La combinación es única: aunque dos móviles abran la app a la vez, un cargo no se apunta dos veces.
alter table public.expenses
  add column recurring_id     uuid references public.recurring_expenses (id) on delete set null,
  add column recurring_charge integer,
  add constraint expenses_recurring_charge_unique unique (recurring_id, recurring_charge);

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.recurring_expenses, public.recurring_expense_shares,
  public.recurring_expense_confirmations from anon, authenticated;
grant select on public.recurring_expenses, public.recurring_expense_shares,
  public.recurring_expense_confirmations to authenticated;

alter table public.recurring_expenses enable row level security;
alter table public.recurring_expense_shares enable row level security;
alter table public.recurring_expense_confirmations enable row level security;

-- Los ve quien ve los gastos del hogar
create policy "recurring_expenses_select" on public.recurring_expenses for select to authenticated
  using (public.can_access_triqui(household_id));
create policy "recurring_expense_shares_select" on public.recurring_expense_shares for select to authenticated
  using (exists (select 1 from public.recurring_expenses r where r.id = recurring_id));
create policy "recurring_expense_confirmations_select" on public.recurring_expense_confirmations for select to authenticated
  using (exists (select 1 from public.recurring_expenses r where r.id = recurring_id));

-- ═════════════ 3. Funciones internas ═════════════
-- ¿Es esta persona adulta y vive ahora en el hogar (que no está archivado)?
create function public.triqui_is_current_adult(p_household uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household and m.user_id = p_user
      and m.role in ('admin', 'member') and m.left_at is null and h.archived_at is null
  );
$$;

-- Hoy, en la zona horaria del hogar
create function public.triqui_household_today(p_household uuid) returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone h.timezone)::date from public.households h where h.id = p_household;
$$;

-- Fecha del cargo número n (empezando en 0), contada desde el primer cargo
create function public.recurring_charge_date(p_start date, p_frequency public.recurring_frequency, p_n integer)
returns date
language sql immutable set search_path = '' as $$
  select case p_frequency
    when 'weekly'  then p_start + 7 * p_n
    when 'monthly' then (p_start + make_interval(months => p_n))::date
    when 'yearly'  then (p_start + make_interval(years => p_n))::date
  end;
$$;

-- Primer número de cargo (desde p_n) cuya fecha es p_from o después. Sirve para saltarse lo que tocó
-- mientras un gasto fijo estaba parado.
create function public.recurring_first_from(
  p_start date, p_frequency public.recurring_frequency, p_n integer, p_from date
) returns integer
language plpgsql immutable set search_path = '' as $$
declare
  v_n integer := p_n;
begin
  while public.recurring_charge_date(p_start, p_frequency, v_n) < p_from loop
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ¿Hay algún cargo apuntado de este gasto fijo (aunque luego se borrara)?
create function public.recurring_has_charges(p_recurring uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.expenses where recurring_id = p_recurring);
$$;

-- Primer cargo: como mucho 3 meses atrás (para apuntar algo que ya se pagó) y 1 año adelante
create function public.recurring_check_start(p_start date, p_today date) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if p_start is null or p_start < p_today - 92 or p_start > p_today + 366 then
    raise exception 'Invalid start date';
  end if;
end $$;

create function public.recurring_is_participant(p_recurring uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.recurring_expenses where id = p_recurring and paid_by = p_user)
      or exists (select 1 from public.recurring_expense_shares where recurring_id = p_recurring and user_id = p_user);
$$;

-- Guarda entre quiénes se reparte, comprobando que todo vale. Quien paga y quienes participan tienen
-- que ser adultos que viven ahora en el hogar.
create function public.recurring_save_parts(
  p_recurring uuid, p_household uuid, p_amount integer, p_method public.expense_split_method,
  p_paid_by uuid, p_shares jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_method is null or p_method not in ('equal', 'shares') then
    raise exception 'Recurring expenses are split equally or by shares';
  end if;
  -- Comprueba la lista y las partes (si algo no vale, triqui_split lanza el error)
  perform 1 from public.triqui_split(p_amount, p_method, p_shares);
  if (select count(*) from jsonb_array_elements(p_shares))
     <> (select count(distinct x ->> 'user_id') from jsonb_array_elements(p_shares) x) then
    raise exception 'Each person can only appear once';
  end if;
  if exists (
    select (x ->> 'user_id')::uuid from jsonb_array_elements(p_shares) x
    union
    select p_paid_by
    except
    select m.user_id from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household and m.role in ('admin', 'member') and m.left_at is null
      and h.archived_at is null
  ) then
    raise exception 'Everyone in an expense must be an adult member of the household';
  end if;

  delete from public.recurring_expense_shares where recurring_id = p_recurring;
  insert into public.recurring_expense_shares (recurring_id, user_id, weight)
  select p_recurring, (x ->> 'user_id')::uuid,
         case when p_method = 'shares' then (x ->> 'weight')::integer end
  from jsonb_array_elements(p_shares) x;
end $$;

-- Si ya han confirmado todos los que participan, el gasto fijo pasa a confirmado.
-- Si ya había estado confirmado antes (vuelve a funcionar tras pararse), sigue desde hoy:
-- lo que tocó mientras estaba parado no se cobra.
create function public.recurring_refresh_status(p_recurring uuid) returns void
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
                                       public.triqui_household_today(r.household_id));
  end if;
  update public.recurring_expenses
  set status = 'confirmed', confirmed_at = now(), first_confirmed_at = coalesce(first_confirmed_at, now()),
      charges_made = v_n, next_charge_on = public.recurring_charge_date(starts_on, frequency, v_n)
  where id = p_recurring;
end $$;

-- Apunta los cargos que tocan (hasta hoy) de los gastos fijos confirmados y activos de un hogar.
-- Devuelve cuántos ha apuntado. Como mucho 100 por vez (el resto, la próxima).
-- Si un gasto fijo diera un error, se salta (queda en el registro de Supabase) y siguen los demás:
-- un gasto fijo roto nunca bloquea al resto ni a las páginas.
create function public.recurring_generate(p_household uuid) returns integer
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
        v_date := public.recurring_charge_date(r.starts_on, r.frequency, v_n);
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
        set charges_made = v_n, next_charge_on = public.recurring_charge_date(r.starts_on, r.frequency, v_n)
        where id = r.id;
      end if;
      v_made := v_made + v_here;
    exception when others then
      raise warning 'Gasto fijo % sin poner al día: %', r.id, sqlerrm;
    end;
  end loop;
  return v_made;
end $$;

-- ═════════════ 4. De la compra a un gasto (RPC) ═════════════
-- Crea el gasto con las mismas reglas que create_expense, guarda qué productos eran y los quita de la
-- lista. Los productos tienen que estar comprados y en la lista común de ese hogar.
create function public.create_expense_from_shopping(
  p_household uuid, p_items uuid[], p_description text, p_amount_cents integer, p_spent_on date,
  p_split_method public.expense_split_method, p_payers jsonb, p_shares jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid;
  v_items uuid[];
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can add expenses'; end if;

  select array_agg(distinct x) into v_items from unnest(p_items) x where x is not null;
  if v_items is null then raise exception 'Choose at least one bought item'; end if;
  if cardinality(v_items) > 100 then raise exception 'Too many items in one expense'; end if;

  -- Se bloquean para que nadie los pase a otro gasto (ni los borre) a la vez
  perform 1 from public.shopping_items where id = any(v_items) and household_id = p_household order by id for update;
  if (select count(*) from public.shopping_items
      where id = any(v_items) and household_id = p_household and checked_at is not null) <> cardinality(v_items) then
    raise exception 'Some items are no longer in the bought list';
  end if;

  v_id := public.create_expense(p_household, p_description, p_amount_cents, p_spent_on,
                                p_split_method, p_payers, p_shares);
  update public.expenses set source = 'shopping' where id = v_id;

  insert into public.expense_items (expense_id, position, name, quantity)
  select v_id, row_number() over (order by s.checked_at, s.created_at, s.id), s.name, s.quantity
  from public.shopping_items s where s.id = any(v_items);

  delete from public.shopping_items where id = any(v_items);
  return v_id;
end $$;

-- Si se borra un gasto que venía de la compra, sus productos NO vuelven a la lista: ya se compraron.

-- ═════════════ 5. Gastos fijos (RPC) ═════════════
-- p_shares: [{"user_id": "..."}] a partes iguales, o [{"user_id": "...", "weight": 2}] por partes.
create function public.create_recurring_expense(
  p_household uuid, p_description text, p_amount_cents integer, p_frequency public.recurring_frequency,
  p_starts_on date, p_paid_by uuid, p_split_method public.expense_split_method, p_shares jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  v_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can add expenses'; end if;
  perform public.recurring_check_start(p_starts_on, public.triqui_household_today(p_household));

  insert into public.recurring_expenses (household_id, description, amount_cents, frequency, starts_on,
                                         next_charge_on, paid_by, split_method, created_by, updated_by)
  values (p_household, btrim(p_description), p_amount_cents, p_frequency, p_starts_on,
          p_starts_on, p_paid_by, p_split_method, uid, uid)
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

-- Editar. Si nunca se ha confirmado: quien lo creó o un admin, y se vuelve a pedir confirmación a todos.
-- Si ya se confirmó alguna vez: solo un admin; quien ya lo había confirmado no tiene que repetir, pero
-- si entra alguien nuevo, se para hasta que lo confirme (y luego sigue desde hoy).
-- Cuándo se cobra (primer cargo y cada cuánto) solo se puede cambiar mientras no haya ningún cargo.
create function public.update_recurring_expense(
  p_recurring uuid, p_version integer, p_description text, p_amount_cents integer,
  p_frequency public.recurring_frequency, p_starts_on date, p_paid_by uuid,
  p_split_method public.expense_split_method, p_shares jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid            uuid := (select auth.uid());
  r              public.recurring_expenses;
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

  v_new_schedule := p_frequency is distinct from r.frequency or p_starts_on is distinct from r.starts_on;
  if v_new_schedule then
    if public.recurring_has_charges(p_recurring) then
      raise exception 'The schedule cannot change after the first charge';
    end if;
    perform public.recurring_check_start(p_starts_on, public.triqui_household_today(r.household_id));
  end if;

  update public.recurring_expenses
  set description = btrim(p_description), amount_cents = p_amount_cents, frequency = p_frequency,
      starts_on = p_starts_on,
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

-- Dar por bueno un gasto fijo en el que participas
create function public.confirm_recurring_expense(p_recurring uuid, p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  r   public.recurring_expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.recurring_expenses where id = p_recurring for update;
  if not found or not public.recurring_is_participant(p_recurring, uid) or not public.is_household_adult(r.household_id) then
    raise exception 'Only people in the expense can confirm it';
  end if;
  if p_version is distinct from r.version then raise exception 'Expense changed'; end if;
  if r.status <> 'pending' then raise exception 'This expense is not waiting for confirmation'; end if;

  insert into public.recurring_expense_confirmations (recurring_id, user_id) values (p_recurring, uid)
  on conflict do nothing;
  perform public.recurring_refresh_status(p_recurring);
  perform public.recurring_generate(r.household_id);
end $$;

-- Rechazar un gasto fijo en el que participas (con un motivo opcional)
create function public.reject_recurring_expense(p_recurring uuid, p_version integer, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  r   public.recurring_expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.recurring_expenses where id = p_recurring for update;
  if not found or not public.recurring_is_participant(p_recurring, uid) or not public.is_household_adult(r.household_id) then
    raise exception 'Only people in the expense can reject it';
  end if;
  if p_version is distinct from r.version then raise exception 'Expense changed'; end if;
  if r.status <> 'pending' then raise exception 'This expense is not waiting for confirmation'; end if;
  -- Si ya funcionaba y se ha parado por un cambio del admin, solo puede rechazar quien entra nuevo
  if r.first_confirmed_at is not null and exists (
    select 1 from public.recurring_expense_confirmations where recurring_id = p_recurring and user_id = uid
  ) then
    raise exception 'This expense is not waiting for confirmation';
  end if;

  update public.recurring_expenses
  set status = 'rejected', rejected_by = uid, rejected_reason = nullif(btrim(p_reason), '')
  where id = p_recurring;
end $$;

-- Pausar o reanudar: un admin o quien paga. Al pausar, antes se apunta lo que ya tocaba.
-- Al reanudar, se salta lo que tocó mientras estaba parado: el próximo cargo es hoy o después.
create function public.set_recurring_expense_active(p_recurring uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid   uuid := (select auth.uid());
  r     public.recurring_expenses;
  v_n   integer;
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
  v_n := public.recurring_first_from(r.starts_on, r.frequency, r.charges_made, v_today);
  update public.recurring_expenses
  set active = true, charges_made = v_n, next_charge_on = public.recurring_charge_date(r.starts_on, r.frequency, v_n),
      updated_by = uid
  where id = p_recurring;
  perform public.recurring_generate(r.household_id);
end $$;

-- Borrar un gasto fijo (mismos permisos que editar). Los cargos ya apuntados se quedan.
create function public.delete_recurring_expense(p_recurring uuid, p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  r   public.recurring_expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.recurring_expenses where id = p_recurring for update;
  if not found then raise exception 'Expense not found'; end if;
  if not (public.is_household_admin(r.household_id)
          or (r.first_confirmed_at is null and r.created_by = uid and public.is_household_adult(r.household_id))) then
    raise exception 'You cannot delete this expense';
  end if;
  if p_version is distinct from r.version then raise exception 'Expense changed'; end if;

  perform public.recurring_generate(r.household_id);
  delete from public.recurring_expenses where id = p_recurring;
end $$;

-- Pone al día los gastos fijos de un hogar. La app lo llama al abrir los gastos o el hogar.
create function public.sync_recurring_expenses(p_household uuid) returns integer
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_access_triqui(p_household) then raise exception 'Not allowed'; end if;
  return public.recurring_generate(p_household);
end $$;

-- Quien se va del hogar (o borra su cuenta) sale de sus gastos fijos. Antes se apunta lo que ya
-- tocaba con esa persona dentro. Si pagaba alguno, ese se para hasta que un admin cambie quién paga.
-- Va "antes" del cambio (before update) para que, al poner al día, esa persona aún cuente como del hogar.
create function public.recurring_member_left() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  perform public.recurring_generate(new.household_id);

  delete from public.recurring_expense_shares s
  using public.recurring_expenses r
  where r.id = s.recurring_id and r.household_id = new.household_id and s.user_id = new.user_id;
  delete from public.recurring_expense_confirmations c
  using public.recurring_expenses r
  where r.id = c.recurring_id and r.household_id = new.household_id and c.user_id = new.user_id;

  update public.recurring_expenses set status = 'pending', confirmed_at = null
  where household_id = new.household_id and paid_by = new.user_id and status = 'confirmed';

  -- Los que solo esperaban su confirmación ya pueden quedar confirmados
  for v_id in
    select id from public.recurring_expenses
    where household_id = new.household_id and status = 'pending' and paid_by <> new.user_id
  loop
    perform public.recurring_refresh_status(v_id);
  end loop;
  return new;
end $$;
create trigger household_members_left_recurring
  before update of left_at on public.household_members
  for each row when (old.left_at is null and new.left_at is not null)
  execute function public.recurring_member_left();

-- ═════════════ 6. Para más adelante: apuntar los cargos aunque nadie abra la app ═════════════
-- Pone al día todos los hogares. No se puede llamar desde la app. Para usarlo, en Supabase:
-- Database → Extensions → activar pg_cron, y en el SQL Editor:
--   select cron.schedule('gastos-fijos', '15 3 * * *', 'select public.recurring_generate_all()');
create function public.recurring_generate_all() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_household uuid;
  v_total     integer := 0;
begin
  for v_household in
    select distinct household_id from public.recurring_expenses
    where status = 'confirmed' and active and next_charge_on <= current_date + 1
  loop
    v_total := v_total + public.recurring_generate(v_household);
  end loop;
  return v_total;
end $$;

-- ═════════════ 7. Permisos de ejecución ═════════════
revoke execute on function public.triqui_is_current_adult(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.triqui_household_today(uuid) from public, anon, authenticated;
revoke execute on function public.recurring_charge_date(date, public.recurring_frequency, integer) from public, anon, authenticated;
revoke execute on function public.recurring_first_from(date, public.recurring_frequency, integer, date) from public, anon, authenticated;
revoke execute on function public.recurring_has_charges(uuid) from public, anon, authenticated;
revoke execute on function public.recurring_member_left() from public, anon, authenticated;
revoke execute on function public.recurring_check_start(date, date) from public, anon, authenticated;
revoke execute on function public.recurring_is_participant(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.recurring_save_parts(uuid, uuid, integer, public.expense_split_method, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.recurring_refresh_status(uuid) from public, anon, authenticated;
revoke execute on function public.recurring_generate(uuid) from public, anon, authenticated;
revoke execute on function public.recurring_generate_all() from public, anon, authenticated;

revoke execute on function public.create_expense_from_shopping(uuid, uuid[], text, integer, date, public.expense_split_method, jsonb, jsonb) from public, anon;
revoke execute on function public.create_recurring_expense(uuid, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb) from public, anon;
revoke execute on function public.update_recurring_expense(uuid, integer, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb) from public, anon;
revoke execute on function public.confirm_recurring_expense(uuid, integer) from public, anon;
revoke execute on function public.reject_recurring_expense(uuid, integer, text) from public, anon;
revoke execute on function public.set_recurring_expense_active(uuid, boolean) from public, anon;
revoke execute on function public.delete_recurring_expense(uuid, integer) from public, anon;
revoke execute on function public.sync_recurring_expenses(uuid) from public, anon;

grant execute on function public.create_expense_from_shopping(uuid, uuid[], text, integer, date, public.expense_split_method, jsonb, jsonb) to authenticated;
grant execute on function public.create_recurring_expense(uuid, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb) to authenticated;
grant execute on function public.update_recurring_expense(uuid, integer, text, integer, public.recurring_frequency, date, uuid, public.expense_split_method, jsonb) to authenticated;
grant execute on function public.confirm_recurring_expense(uuid, integer) to authenticated;
grant execute on function public.reject_recurring_expense(uuid, integer, text) to authenticated;
grant execute on function public.set_recurring_expense_active(uuid, boolean) to authenticated;
grant execute on function public.delete_recurring_expense(uuid, integer) to authenticated;
grant execute on function public.sync_recurring_expenses(uuid) to authenticated;
