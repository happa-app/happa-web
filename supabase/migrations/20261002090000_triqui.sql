-- HAPPA · Migración 8: triqui (gastos compartidos del hogar)
--
-- Cómo funciona:
--   · Un gasto tiene uno o varios pagadores (cada uno con lo que puso) y un reparto que dice cuánto
--     le toca a cada uno: a partes iguales, por partes (2 frente a 1) o por importes exactos.
--   · Lo confirman todos los que participan (pagaron o les toca pagar); quien lo crea ya lo confirma.
--     Mientras falte alguien está "pendiente" y no cuenta en los saldos. Si alguien lo rechaza queda
--     "rechazado" hasta que se corrija (se vuelve a pedir confirmación) o se borre.
--     Si alguien no contesta, un admin puede darlo por bueno.
--   · Antes de confirmarse lo edita o borra quien lo creó (o un admin); después, solo un admin.
--   · Pagos para saldar deudas: si lo apunta quien paga, queda pendiente hasta que quien recibe lo
--     confirme; si lo apunta quien recibe, vale directamente.
--   · Los repartos y los saldos se calculan aquí, en la base de datos: nadie puede trucarlos.
--   · Cada gasto tiene un número de versión que sube al editarlo. Confirmar, rechazar, editar o borrar
--     exige la versión que tenías en pantalla: si alguien lo ha cambiado mientras tanto, no vale.
--
-- Quién lo ve: los adultos del hogar (admin y miembros); ni menores ni casero. Quien se va del hogar
-- con saldo pendiente lo sigue viendo (y puede confirmar y apuntar pagos) hasta saldarlo.
-- Nadie puede escribir en las tablas directamente: todo pasa por las funciones de la sección 6.

-- ═════════════ 1. Tipos ═════════════
create type public.expense_split_method as enum ('equal', 'shares', 'exact');
-- De dónde viene un gasto (de momento solo 'manual'; los demás llegarán con la compra y los gastos fijos)
create type public.expense_source as enum ('manual', 'shopping', 'recurring', 'landlord');
create type public.triqui_status as enum ('pending', 'confirmed', 'rejected');

-- ═════════════ 2. Tablas ═════════════
-- Importes siempre en céntimos (enteros), para que no haya errores de redondeo.
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households (id) on delete cascade,
  description     text not null
                  constraint expenses_description_length check (char_length(description) between 1 and 80),
  amount_cents    integer not null
                  constraint expenses_amount_range check (amount_cents between 1 and 10000000),
  currency        text not null default 'EUR' constraint expenses_currency check (currency = 'EUR'),
  spent_on        date not null default current_date,
  split_method    public.expense_split_method not null,
  source          public.expense_source not null default 'manual',
  status          public.triqui_status not null default 'pending',
  -- Sube cada vez que se edita (ver cabecera)
  version         integer not null default 1,
  created_by      uuid references public.profiles (id) on delete set null,
  confirmed_at    timestamptz,
  -- Datos de auditoría (los pone siempre la base de datos)
  updated_by      uuid,
  rejected_by     uuid,
  rejected_reason text constraint expenses_rejected_reason_length check (char_length(rejected_reason) <= 200),
  deleted_at      timestamptz,
  deleted_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index expenses_household_idx on public.expenses (household_id, spent_on desc, created_at desc)
  where deleted_at is null;
create index expenses_created_by_idx on public.expenses (created_by);
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- Quién pagó y cuánto puso cada uno
create table public.expense_payers (
  expense_id   uuid not null references public.expenses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id),
  amount_cents integer not null constraint expense_payers_amount_positive check (amount_cents > 0),
  primary key (expense_id, user_id)
);
create index expense_payers_user_idx on public.expense_payers (user_id);

-- Cuánto le toca a cada uno (weight: las partes, solo en el reparto "por partes")
create table public.expense_shares (
  expense_id   uuid not null references public.expenses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id),
  weight       integer constraint expense_shares_weight_range check (weight between 1 and 99),
  amount_cents integer not null constraint expense_shares_amount_nonnegative check (amount_cents >= 0),
  primary key (expense_id, user_id)
);
create index expense_shares_user_idx on public.expense_shares (user_id);

-- Quién ha dado el gasto por bueno
create table public.expense_confirmations (
  expense_id   uuid not null references public.expenses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id),
  confirmed_at timestamptz not null default now(),
  primary key (expense_id, user_id)
);
create index expense_confirmations_user_idx on public.expense_confirmations (user_id);

-- Pagos entre personas para saldar deudas (Bizum, efectivo...)
create table public.settlements (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  from_user    uuid not null references public.profiles (id),
  to_user      uuid not null references public.profiles (id),
  amount_cents integer not null constraint settlements_amount_range check (amount_cents between 1 and 10000000),
  settled_on   date not null default current_date,
  status       public.triqui_status not null default 'pending',
  confirmed_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint settlements_different_people check (from_user <> to_user)
);
create index settlements_household_idx on public.settlements (household_id, created_at desc);
create index settlements_from_idx on public.settlements (from_user);
create index settlements_to_idx on public.settlements (to_user);

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.expenses, public.expense_payers, public.expense_shares,
  public.expense_confirmations, public.settlements from anon, authenticated;
grant select on public.expenses, public.expense_payers, public.expense_shares,
  public.expense_confirmations, public.settlements to authenticated;

alter table public.expenses enable row level security;
alter table public.expense_payers enable row level security;
alter table public.expense_shares enable row level security;
alter table public.expense_confirmations enable row level security;
alter table public.settlements enable row level security;

-- ═════════════ 3. Saldos y acceso ═════════════
-- Saldo de una persona en un hogar, en céntimos: positivo = le deben; negativo = debe.
-- Solo cuentan los gastos confirmados y los pagos confirmados.
create function public.triqui_net_cents(p_household uuid, p_user uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select
      coalesce((select sum(p.amount_cents) from public.expense_payers p
                join public.expenses e on e.id = p.expense_id
                where e.household_id = p_household and p.user_id = p_user
                  and e.status = 'confirmed' and e.deleted_at is null), 0)
    - coalesce((select sum(s.amount_cents) from public.expense_shares s
                join public.expenses e on e.id = s.expense_id
                where e.household_id = p_household and s.user_id = p_user
                  and e.status = 'confirmed' and e.deleted_at is null), 0)
    + coalesce((select sum(amount_cents) from public.settlements
                where household_id = p_household and from_user = p_user and status = 'confirmed'), 0)
    - coalesce((select sum(amount_cents) from public.settlements
                where household_id = p_household and to_user = p_user and status = 'confirmed'), 0);
$$;

-- Ves el triqui si eres adulto del hogar, o si te fuiste (como adulto) y aún tienes saldo pendiente.
create function public.can_access_triqui(hid uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then return false; end if;
  if public.is_household_adult(hid) then return true; end if;
  return exists (
    select 1 from public.household_members
    where household_id = hid and user_id = uid and role in ('admin', 'member') and left_at is not null
  ) and public.triqui_net_cents(hid, uid) <> 0;
end $$;

-- ═════════════ 4. Quién ve qué (RLS) ═════════════
create policy "expenses_select" on public.expenses for select to authenticated
  using (deleted_at is null and public.can_access_triqui(household_id));

-- Pagadores, reparto y confirmaciones: los de los gastos que ya puedes ver
create policy "expense_payers_select" on public.expense_payers for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id));
create policy "expense_shares_select" on public.expense_shares for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id));
create policy "expense_confirmations_select" on public.expense_confirmations for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id));

create policy "settlements_select" on public.settlements for select to authenticated
  using (public.can_access_triqui(household_id));

-- ═════════════ 5. Funciones internas ═════════════
-- Reparto: cuánto le toca a cada uno. p_shares es una lista:
--   a partes iguales → [{"user_id": "..."}]
--   por partes       → [{"user_id": "...", "weight": 2}]
--   importes exactos → [{"user_id": "...", "amount_cents": 1250}]
-- Iguales y por partes se reparten en proporción; los céntimos que sobran van a quien tiene la parte
-- decimal más grande y, si empatan, siempre en el mismo orden (por id). Así cuadra al céntimo.
create function public.triqui_split(p_total integer, p_method public.expense_split_method, p_shares jsonb)
returns table (user_id uuid, weight integer, amount_cents integer)
language plpgsql immutable set search_path = '' as $$
#variable_conflict use_column
declare
  v_sum bigint;
begin
  if p_shares is null or jsonb_typeof(p_shares) <> 'array' or jsonb_array_length(p_shares) = 0 then
    raise exception 'At least one person must share the expense';
  end if;
  if jsonb_array_length(p_shares) > 50 then raise exception 'Too many people in one expense'; end if;

  if p_method = 'exact' then
    if exists (select 1 from jsonb_array_elements(p_shares) x
               where (x ->> 'amount_cents') is null or (x ->> 'amount_cents')::bigint <= 0) then
      raise exception 'Each share needs a positive amount';
    end if;
    select sum((x ->> 'amount_cents')::bigint) into v_sum from jsonb_array_elements(p_shares) x;
    if v_sum <> p_total then raise exception 'Shares must add up to the total'; end if;

    return query
      select (x ->> 'user_id')::uuid, null::integer, (x ->> 'amount_cents')::integer
      from jsonb_array_elements(p_shares) x;
    return;
  end if;

  if p_method = 'shares' and exists (
    select 1 from jsonb_array_elements(p_shares) x
    where (x ->> 'weight') is null or (x ->> 'weight')::integer not between 1 and 99
  ) then
    raise exception 'Each share needs between 1 and 99 parts';
  end if;

  return query
    with s as (
      select (x ->> 'user_id')::uuid as uid,
             case when p_method = 'shares' then (x ->> 'weight')::integer else 1 end as w
      from jsonb_array_elements(p_shares) x
    ), base as (
      select uid, w,
             (p_total::bigint * w) / sum(w) over () as floor_cents,
             (p_total::bigint * w) % sum(w) over () as remainder
      from s
    ), ranked as (
      select uid, w, floor_cents,
             row_number() over (order by remainder desc, uid) as rn,
             p_total - sum(floor_cents) over () as leftover
      from base
    )
    select uid,
           case when p_method = 'shares' then w end,
           (floor_cents + case when rn <= leftover then 1 else 0 end)::integer
    from ranked;
end $$;

create function public.triqui_is_participant(p_expense uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.expense_payers where expense_id = p_expense and user_id = p_user)
      or exists (select 1 from public.expense_shares where expense_id = p_expense and user_id = p_user);
$$;

-- Guarda quién pagó y el reparto, comprobando que todo cuadra.
-- Pueden participar los adultos activos del hogar; al editar, también quien ya estaba en el gasto
-- (por si se fue del hogar después).
create function public.triqui_save_parts(
  p_expense uuid, p_household uuid, p_total integer, p_method public.expense_split_method,
  p_payers jsonb, p_shares jsonb, p_previous uuid[]
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_sum bigint;
begin
  if p_payers is null or jsonb_typeof(p_payers) <> 'array' or jsonb_array_length(p_payers) = 0 then
    raise exception 'At least one person must have paid';
  end if;
  if jsonb_array_length(p_payers) > 50 then raise exception 'Too many payers'; end if;
  if exists (select 1 from jsonb_array_elements(p_payers) x
             where (x ->> 'amount_cents') is null or (x ->> 'amount_cents')::bigint <= 0) then
    raise exception 'Each payer needs a positive amount';
  end if;
  select sum((x ->> 'amount_cents')::bigint) into v_sum from jsonb_array_elements(p_payers) x;
  if v_sum <> p_total then raise exception 'Payers must add up to the total'; end if;

  delete from public.expense_payers where expense_id = p_expense;
  delete from public.expense_shares where expense_id = p_expense;

  -- Una persona repetida rompe la clave primaria: error
  insert into public.expense_payers (expense_id, user_id, amount_cents)
  select p_expense, (x ->> 'user_id')::uuid, (x ->> 'amount_cents')::integer
  from jsonb_array_elements(p_payers) x;

  insert into public.expense_shares (expense_id, user_id, weight, amount_cents)
  select p_expense, s.user_id, s.weight, s.amount_cents
  from public.triqui_split(p_total, p_method, p_shares) s;

  if exists (
    select user_id from public.expense_payers where expense_id = p_expense
    union
    select user_id from public.expense_shares where expense_id = p_expense
    except
    (
      select m.user_id from public.household_members m
      where m.household_id = p_household and m.role in ('admin', 'member') and m.left_at is null
      union
      select unnest(p_previous)
    )
  ) then
    raise exception 'Everyone in an expense must be an adult member of the household';
  end if;
end $$;

-- Si ya han confirmado todos los que participan, el gasto pasa a confirmado.
create function public.triqui_refresh_status(p_expense uuid) returns void
language sql security definer set search_path = '' as $$
  update public.expenses e
  set status = 'confirmed', confirmed_at = now()
  where e.id = p_expense and e.status = 'pending'
    and not exists (
      select 1
      from (
        select user_id from public.expense_payers where expense_id = p_expense
        union
        select user_id from public.expense_shares where expense_id = p_expense
      ) p
      where not exists (
        select 1 from public.expense_confirmations c
        where c.expense_id = p_expense and c.user_id = p.user_id
      )
    );
$$;

-- stable (no immutable): depende de la fecha de hoy
create function public.triqui_check_date(p_date date) returns void
language plpgsql stable set search_path = '' as $$
begin
  if p_date is not null and (p_date < date '2000-01-01' or p_date > current_date + 1) then
    raise exception 'Invalid date';
  end if;
end $$;

-- ═════════════ 6. Funciones de la app (RPC) ═════════════
-- Nuevo gasto. Devuelve su id.
create function public.create_expense(
  p_household uuid, p_description text, p_amount_cents integer, p_spent_on date,
  p_split_method public.expense_split_method, p_payers jsonb, p_shares jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  v_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adult members can add expenses'; end if;
  perform public.triqui_check_date(p_spent_on);

  insert into public.expenses (household_id, description, amount_cents, spent_on, split_method, created_by, updated_by)
  values (p_household, btrim(p_description), p_amount_cents, coalesce(p_spent_on, current_date),
          p_split_method, uid, uid)
  returning id into v_id;

  perform public.triqui_save_parts(v_id, p_household, p_amount_cents, p_split_method, p_payers, p_shares, '{}');

  -- Quien lo crea ya lo da por bueno (si participa)
  insert into public.expense_confirmations (expense_id, user_id)
  select v_id, uid where public.triqui_is_participant(v_id, uid);
  perform public.triqui_refresh_status(v_id);
  return v_id;
end $$;

-- Editar un gasto. Sin confirmar: quien lo creó o un admin, y se vuelve a pedir confirmación.
-- Confirmado: solo un admin, y sigue confirmado.
create function public.update_expense(
  p_expense uuid, p_version integer, p_description text, p_amount_cents integer, p_spent_on date,
  p_split_method public.expense_split_method, p_payers jsonb, p_shares jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid        uuid := (select auth.uid());
  e          public.expenses;
  v_previous uuid[];
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into e from public.expenses where id = p_expense and deleted_at is null for update;
  if not found then raise exception 'Expense not found'; end if;
  if not (public.is_household_admin(e.household_id)
          or (e.status <> 'confirmed' and e.created_by = uid and public.is_household_adult(e.household_id))) then
    raise exception 'You cannot change this expense';
  end if;
  if p_version is distinct from e.version then raise exception 'Expense changed'; end if;
  perform public.triqui_check_date(p_spent_on);

  select array_agg(p.user_id) into v_previous from (
    select user_id from public.expense_payers where expense_id = p_expense
    union
    select user_id from public.expense_shares where expense_id = p_expense
  ) p;

  update public.expenses
  set description = btrim(p_description), amount_cents = p_amount_cents,
      spent_on = coalesce(p_spent_on, spent_on), split_method = p_split_method, updated_by = uid,
      version = version + 1
  where id = p_expense;

  perform public.triqui_save_parts(p_expense, e.household_id, p_amount_cents, p_split_method,
                                   p_payers, p_shares, coalesce(v_previous, '{}'));

  if e.status <> 'confirmed' then
    delete from public.expense_confirmations where expense_id = p_expense;
    update public.expenses set status = 'pending', rejected_by = null, rejected_reason = null
    where id = p_expense;
    insert into public.expense_confirmations (expense_id, user_id)
    select p_expense, uid where public.triqui_is_participant(p_expense, uid);
    perform public.triqui_refresh_status(p_expense);
  end if;
end $$;

-- Borrar un gasto (se guarda marcado como borrado). Mismos permisos que editar.
create function public.delete_expense(p_expense uuid, p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  e   public.expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into e from public.expenses where id = p_expense and deleted_at is null for update;
  if not found then raise exception 'Expense not found'; end if;
  if not (public.is_household_admin(e.household_id)
          or (e.status <> 'confirmed' and e.created_by = uid and public.is_household_adult(e.household_id))) then
    raise exception 'You cannot delete this expense';
  end if;
  if p_version is distinct from e.version then raise exception 'Expense changed'; end if;
  update public.expenses set deleted_at = now(), deleted_by = uid where id = p_expense;
end $$;

-- Dar por bueno un gasto en el que participas
create function public.confirm_expense(p_expense uuid, p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  e   public.expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into e from public.expenses where id = p_expense and deleted_at is null for update;
  if not found or not public.triqui_is_participant(p_expense, uid) or not public.can_access_triqui(e.household_id) then
    raise exception 'Only people in the expense can confirm it';
  end if;
  if p_version is distinct from e.version then raise exception 'Expense changed'; end if;
  if e.status <> 'pending' then raise exception 'This expense is not waiting for confirmation'; end if;

  insert into public.expense_confirmations (expense_id, user_id) values (p_expense, uid)
  on conflict do nothing;
  perform public.triqui_refresh_status(p_expense);
end $$;

-- Rechazar un gasto en el que participas (con un motivo opcional)
create function public.reject_expense(p_expense uuid, p_version integer, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  e   public.expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into e from public.expenses where id = p_expense and deleted_at is null for update;
  if not found or not public.triqui_is_participant(p_expense, uid) or not public.can_access_triqui(e.household_id) then
    raise exception 'Only people in the expense can reject it';
  end if;
  if p_version is distinct from e.version then raise exception 'Expense changed'; end if;
  if e.status <> 'pending' then raise exception 'This expense is not waiting for confirmation'; end if;

  update public.expenses
  set status = 'rejected', rejected_by = uid, rejected_reason = nullif(btrim(p_reason), '')
  where id = p_expense;
end $$;

-- El admin da por bueno un gasto pendiente (por ejemplo, si alguien no contesta)
create function public.force_confirm_expense(p_expense uuid, p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  e   public.expenses;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into e from public.expenses where id = p_expense and deleted_at is null for update;
  if not found or not public.is_household_admin(e.household_id) then
    raise exception 'Only an admin can confirm an expense for everyone';
  end if;
  if p_version is distinct from e.version then raise exception 'Expense changed'; end if;
  if e.status <> 'pending' then raise exception 'This expense is not waiting for confirmation'; end if;

  update public.expenses set status = 'confirmed', confirmed_at = now(), updated_by = uid where id = p_expense;
end $$;

-- Apuntar un pago. Lo apunta quien paga (queda pendiente) o quien recibe (vale directamente).
create function public.record_payment(
  p_household uuid, p_from uuid, p_to uuid, p_amount_cents integer, p_settled_on date default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  v_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if uid <> p_from and uid <> p_to then raise exception 'You can only record payments you made or received'; end if;
  if not public.can_access_triqui(p_household) then raise exception 'Not allowed'; end if;
  -- Los dos tienen que ser (o haber sido) adultos del hogar
  if (select count(*) from public.household_members
      where household_id = p_household and user_id in (p_from, p_to) and role in ('admin', 'member')) <> 2 then
    raise exception 'Both people must be adult members of the household';
  end if;
  -- Y la otra persona tiene que seguir en el triqui: adulta actual o con saldo pendiente.
  -- (Si no, un pago de 1 céntimo devolvería el acceso a alguien que se fue en paz.)
  if not exists (
    select 1 from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household and m.user_id = case when uid = p_from then p_to else p_from end
      and m.role in ('admin', 'member') and m.left_at is null and h.archived_at is null
  ) and public.triqui_net_cents(p_household, case when uid = p_from then p_to else p_from end) = 0 then
    raise exception 'Both people must be adult members of the household';
  end if;
  perform public.triqui_check_date(p_settled_on);

  insert into public.settlements (household_id, from_user, to_user, amount_cents, settled_on, status, confirmed_at)
  values (p_household, p_from, p_to, p_amount_cents, coalesce(p_settled_on, current_date),
          case when uid = p_to then 'confirmed' else 'pending' end::public.triqui_status,
          case when uid = p_to then now() end)
  returning id into v_id;
  return v_id;
end $$;

-- Quien recibe confirma o rechaza un pago pendiente. Si quien recibe borró su cuenta,
-- puede hacerlo un admin del hogar (si no, ese pago se quedaría pendiente para siempre).
create function public.triqui_can_answer_payment(st public.settlements) returns boolean
language sql stable security definer set search_path = '' as $$
  select st.status = 'pending' and public.can_access_triqui(st.household_id) and (
    st.to_user = (select auth.uid())
    or (public.is_household_admin(st.household_id)
        and exists (select 1 from public.profiles where id = st.to_user and deleted_at is not null))
  );
$$;

create function public.confirm_payment(p_settlement uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  st public.settlements;
begin
  select * into st from public.settlements where id = p_settlement for update;
  if not found or not public.triqui_can_answer_payment(st) then
    raise exception 'Payment not found or not waiting for you';
  end if;
  update public.settlements set status = 'confirmed', confirmed_at = now() where id = p_settlement;
end $$;

create function public.reject_payment(p_settlement uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  st public.settlements;
begin
  select * into st from public.settlements where id = p_settlement for update;
  if not found or not public.triqui_can_answer_payment(st) then
    raise exception 'Payment not found or not waiting for you';
  end if;
  update public.settlements set status = 'rejected' where id = p_settlement;
end $$;

-- Quien pagó retira un pago que aún no le han confirmado
create function public.cancel_payment(p_settlement uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  st public.settlements;
begin
  select * into st from public.settlements where id = p_settlement for update;
  if not found or st.from_user <> (select auth.uid()) or st.status <> 'pending'
     or not public.can_access_triqui(st.household_id) then
    raise exception 'Payment not found or already answered';
  end if;
  delete from public.settlements where id = p_settlement;
end $$;

-- Saldos del hogar: cada adulto actual y cualquiera que haya participado, con su saldo.
create function public.get_triqui_balances(p_household uuid)
returns table (user_id uuid, display_name text, is_current boolean, net_cents bigint)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.can_access_triqui(p_household) then raise exception 'Not allowed'; end if;

  return query
    with people as (
      select m.user_id as uid from public.household_members m
      where m.household_id = p_household and m.role in ('admin', 'member') and m.left_at is null
      union
      select p.user_id from public.expense_payers p
      join public.expenses e on e.id = p.expense_id
      where e.household_id = p_household and e.deleted_at is null
      union
      select s.user_id from public.expense_shares s
      join public.expenses e on e.id = s.expense_id
      where e.household_id = p_household and e.deleted_at is null
      union
      select st.from_user from public.settlements st where st.household_id = p_household and st.status <> 'rejected'
      union
      select st.to_user from public.settlements st where st.household_id = p_household and st.status <> 'rejected'
    )
    select pe.uid, pr.display_name,
           exists (select 1 from public.household_members m
                   where m.household_id = p_household and m.user_id = pe.uid
                     and m.role in ('admin', 'member') and m.left_at is null),
           public.triqui_net_cents(p_household, pe.uid)
    from people pe
    join public.profiles pr on pr.id = pe.uid
    order by pr.display_name, pe.uid;
end $$;

-- Datos del hogar para las pantallas del triqui. Sirve también a quien se fue con saldo pendiente,
-- que ya no puede leer la tabla de hogares.
create function public.get_triqui_context(p_household uuid)
returns table (name text, timezone text, is_current boolean, is_admin boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_access_triqui(p_household) then raise exception 'Not allowed'; end if;
  return query
    select h.name, h.timezone, public.is_household_adult(p_household), public.is_household_admin(p_household)
    from public.households h where h.id = p_household;
end $$;

-- Hogares que dejaste (o que se archivaron) donde aún tienes saldo pendiente
create function public.my_triqui_debts()
returns table (household_id uuid, name text, net_cents bigint)
language sql stable security definer set search_path = '' as $$
  select h.id, h.name, public.triqui_net_cents(h.id, m.user_id)
  from public.household_members m
  join public.households h on h.id = m.household_id
  where m.user_id = (select auth.uid()) and m.role in ('admin', 'member')
    and (m.left_at is not null or h.archived_at is not null)
    and public.triqui_net_cents(h.id, m.user_id) <> 0
  order by h.name;
$$;

-- ═════════════ 7. Moneda del hogar ═════════════
-- De momento el triqui solo usa euros: la moneda del hogar deja de poder cambiarse desde la app
-- (la migración 3 lo dejaba abierto). Cuando haya varias monedas se abrirá con su propia regla.
revoke update (currency) on public.households from authenticated;

-- Nota para más adelante: la purga de hogares archivados (migración 3) aún no está programada.
-- Cuando se haga, no debe borrar hogares con saldos pendientes: gastos y pagos se borran en cascada.

-- ═════════════ 8. Permisos de ejecución ═════════════
revoke execute on function public.triqui_net_cents(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.triqui_split(integer, public.expense_split_method, jsonb) from public, anon, authenticated;
revoke execute on function public.triqui_is_participant(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.triqui_save_parts(uuid, uuid, integer, public.expense_split_method, jsonb, jsonb, uuid[]) from public, anon, authenticated;
revoke execute on function public.triqui_refresh_status(uuid) from public, anon, authenticated;
revoke execute on function public.triqui_check_date(date) from public, anon, authenticated;
revoke execute on function public.triqui_can_answer_payment(public.settlements) from public, anon, authenticated;

revoke execute on function public.can_access_triqui(uuid) from public, anon;
revoke execute on function public.create_expense(uuid, text, integer, date, public.expense_split_method, jsonb, jsonb) from public, anon;
revoke execute on function public.update_expense(uuid, integer, text, integer, date, public.expense_split_method, jsonb, jsonb) from public, anon;
revoke execute on function public.delete_expense(uuid, integer) from public, anon;
revoke execute on function public.confirm_expense(uuid, integer) from public, anon;
revoke execute on function public.reject_expense(uuid, integer, text) from public, anon;
revoke execute on function public.force_confirm_expense(uuid, integer) from public, anon;
revoke execute on function public.record_payment(uuid, uuid, uuid, integer, date) from public, anon;
revoke execute on function public.confirm_payment(uuid) from public, anon;
revoke execute on function public.reject_payment(uuid) from public, anon;
revoke execute on function public.cancel_payment(uuid) from public, anon;
revoke execute on function public.get_triqui_balances(uuid) from public, anon;
revoke execute on function public.get_triqui_context(uuid) from public, anon;
revoke execute on function public.my_triqui_debts() from public, anon;

grant execute on function public.can_access_triqui(uuid) to authenticated;
grant execute on function public.create_expense(uuid, text, integer, date, public.expense_split_method, jsonb, jsonb) to authenticated;
grant execute on function public.update_expense(uuid, integer, text, integer, date, public.expense_split_method, jsonb, jsonb) to authenticated;
grant execute on function public.delete_expense(uuid, integer) to authenticated;
grant execute on function public.confirm_expense(uuid, integer) to authenticated;
grant execute on function public.reject_expense(uuid, integer, text) to authenticated;
grant execute on function public.force_confirm_expense(uuid, integer) to authenticated;
grant execute on function public.record_payment(uuid, uuid, uuid, integer, date) to authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid) to authenticated;
grant execute on function public.cancel_payment(uuid) to authenticated;
grant execute on function public.get_triqui_balances(uuid) to authenticated;
grant execute on function public.get_triqui_context(uuid) to authenticated;
grant execute on function public.my_triqui_debts() to authenticated;
