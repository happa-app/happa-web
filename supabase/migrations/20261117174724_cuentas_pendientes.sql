-- HAPPA · Migración 29: conversación «Cuentas pendientes» (Términos 5.4, Privacidad 4.2)
--
-- Ejemplo: en el piso viven Ana, Bruno y Carla. Bruno se va debiendo 30 € a Ana.
--   · Bruno deja de ver el chat del piso y los gastos (antes los veía hasta saldar: migraciones 8 y 13).
--   · Se abre una conversación aparte, «Cuentas pendientes», de Bruno en ese piso. La ven Bruno y solo las personas
--     con saldo de signo contrario al suyo: si él debe, a quienes el piso les debe (Ana); si a él le deben, quienes
--     deben. Carla, que también debe, no la ve.
--   · Quién está dentro no se guarda: se calcula con los saldos de cada momento. Por eso, cuando el saldo de Bruno
--     llega a cero, la conversación desaparece para todos; y si vuelve a haber saldo (un admin corrige un gasto),
--     reaparece sola, con sus mensajes.
--   · Desde ahí Bruno puede marcar pagos a esas personas y responder a los que le hagan (sin ver Gastos).
--   · Si los dos se han ido (hogar archivado), la conversación del que debe incluye a quienes le deben aunque se
--     hayan ido; la del que tiene a favor solo incluye a quienes siguen en el piso. Así no salen dos conversaciones
--     para la misma pareja.
--   · Los mensajes se guardan con el hogar, como el resto de su historial (se borran con él: migración 26).

-- ═════════════ 1. La conversación ═════════════
-- departed_id: quién se fue (solo en las de «Cuentas pendientes»). Una por persona y hogar.
alter table public.conversations
  add column departed_id uuid references public.profiles (id) on delete cascade;

alter table public.conversations drop constraint conversations_household;
alter table public.conversations add constraint conversations_household check (
  (kind in ('tenants', 'landlord') and household_id is not null and departed_id is null)
  or (kind = 'debts' and household_id is not null and departed_id is not null)
  or (kind = 'listing' and household_id is null and departed_id is null)
);

-- El índice de «un chat de cada tipo por hogar» no sirve para las de cuentas pendientes (puede haber varias)
drop index public.conversations_household_kind_idx;
create unique index conversations_household_kind_idx on public.conversations (household_id, kind)
  where household_id is not null and kind <> 'debts';
create unique index conversations_debts_idx on public.conversations (household_id, departed_id)
  where kind = 'debts';

-- El chat de cada hogar nuevo (migración 13): su "on conflict" tiene que repetir la condición del índice nuevo
create or replace function public.households_create_chat() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.conversations (kind, household_id) values ('tenants', new.id)
  on conflict (household_id, kind) where household_id is not null and kind <> 'debts' do nothing;
  return new;
end $$;

-- ═════════════ 2. Quién está en ella ═════════════
-- ¿Está abierta la de esta persona? Estuvo como adulta, ya no vive en el hogar (o se archivó) y tiene saldo.
create function public.debts_open(p_household uuid, p_departed uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household and m.user_id = p_departed and m.role in ('admin', 'member')
      and (m.left_at is not null or h.archived_at is not null)
  ) and public.triqui_net_cents(p_household, p_departed) <> 0;
$$;

-- ¿Está p_user en la conversación de p_departed como la otra parte? Saldo de signo contrario y, si es quien
-- debe dinero a p_departed y también se fue, no (ver la última regla de arriba).
create function public.debts_counterpart(p_household uuid, p_departed uuid, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_departed bigint;
  v_user     bigint;
  v_resident boolean;
begin
  if p_user is null or p_user = p_departed or not public.debts_open(p_household, p_departed) then
    return false;
  end if;
  select (m.left_at is null and h.archived_at is null) into v_resident
  from public.household_members m
  join public.households h on h.id = m.household_id
  where m.household_id = p_household and m.user_id = p_user and m.role in ('admin', 'member');
  if not found then return false; end if;

  v_departed := public.triqui_net_cents(p_household, p_departed);
  v_user := public.triqui_net_cents(p_household, p_user);
  return v_user <> 0 and sign(v_user) = -sign(v_departed) and (v_resident or v_departed < 0);
end $$;

-- ¿Pueden saldar cuentas estas dos personas a través de «Cuentas pendientes»? (una se fue, la otra es su
-- contraparte, en cualquier orden)
create function public.debts_pair(p_household uuid, p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.debts_counterpart(p_household, p_a, p_b) or public.debts_counterpart(p_household, p_b, p_a);
$$;

-- Quién puede leer y escribir en una conversación. Chat del hogar: solo quien vive en él (ya no quien se fue con
-- saldo: para eso está «Cuentas pendientes»).
create or replace function public.chat_member(p_conversation uuid, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  c public.conversations;
begin
  if p_user is null then return false; end if;
  select * into c from public.conversations where id = p_conversation;
  if not found then return false; end if;

  if c.kind = 'tenants' then
    return exists (
      select 1 from public.household_members m
      join public.households h on h.id = m.household_id
      where m.household_id = c.household_id and m.user_id = p_user
        and m.role in ('admin', 'member', 'minor') and m.left_at is null and h.archived_at is null
    );
  elsif c.kind = 'debts' then
    return (p_user = c.departed_id and public.debts_open(c.household_id, c.departed_id))
      or public.debts_counterpart(c.household_id, c.departed_id, p_user);
  end if;
  return false;
end $$;

-- ═════════════ 3. Gastos: quien se fue ya no los ve ═════════════
-- Antes también podía quien se fue con saldo pendiente; ahora lo resuelve desde «Cuentas pendientes».
create or replace function public.can_access_triqui(hid uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then return false; end if;
  return public.is_household_adult(hid);
end $$;

-- ═════════════ 4. Pagos desde «Cuentas pendientes» ═════════════
-- Igual que en la migración 8, pero quien se fue puede apuntar pagos con su contraparte (y al revés si la
-- contraparte también se fue).
create or replace function public.record_payment(
  p_household uuid, p_from uuid, p_to uuid, p_amount_cents integer, p_settled_on date default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_other uuid;
  v_id    uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if uid <> p_from and uid <> p_to then raise exception 'You can only record payments you made or received'; end if;
  v_other := case when uid = p_from then p_to else p_from end;
  if not (public.can_access_triqui(p_household) or public.debts_pair(p_household, uid, v_other)) then
    raise exception 'Not allowed';
  end if;
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
    where m.household_id = p_household and m.user_id = v_other
      and m.role in ('admin', 'member') and m.left_at is null and h.archived_at is null
  ) and public.triqui_net_cents(p_household, v_other) = 0 then
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

-- Quien recibe confirma o rechaza; si quien recibe borró su cuenta, un admin. Ahora también desde
-- «Cuentas pendientes».
create or replace function public.triqui_can_answer_payment(st public.settlements) returns boolean
language sql stable security definer set search_path = '' as $$
  select st.status = 'pending' and (
    (st.to_user = (select auth.uid())
      and (public.can_access_triqui(st.household_id) or public.debts_pair(st.household_id, st.to_user, st.from_user)))
    or (public.is_household_admin(st.household_id)
        and exists (select 1 from public.profiles where id = st.to_user and deleted_at is not null))
  );
$$;

create or replace function public.cancel_payment(p_settlement uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  st public.settlements;
begin
  select * into st from public.settlements where id = p_settlement for update;
  if not found or st.from_user <> (select auth.uid()) or st.status <> 'pending'
     or not (public.can_access_triqui(st.household_id) or public.debts_pair(st.household_id, st.from_user, st.to_user)) then
    raise exception 'Payment not found or already answered';
  end if;
  delete from public.settlements where id = p_settlement;
end $$;

-- ═════════════ 5. Se crea al irse ═════════════
-- Al salir un adulto se crea su conversación (vacía). Solo se ve mientras tenga saldo (ver chat_member).
create function public.debts_create_chat() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('admin', 'member') then
    insert into public.conversations (kind, household_id, departed_id)
    values ('debts', new.household_id, new.user_id)
    on conflict (household_id, departed_id) where kind = 'debts' do nothing;
  end if;
  return null;
end $$;
create trigger household_members_left_debts_chat
  after update of left_at on public.household_members
  for each row when (old.left_at is null and new.left_at is not null)
  execute function public.debts_create_chat();

-- Los que ya se fueron
insert into public.conversations (kind, household_id, departed_id)
select 'debts', m.household_id, m.user_id
from public.household_members m
join public.households h on h.id = m.household_id
where m.role in ('admin', 'member') and (m.left_at is not null or h.archived_at is not null)
on conflict (household_id, departed_id) where kind = 'debts' do nothing;

-- ═════════════ 6. Funciones de la app (RPC) ═════════════
-- Tus conversaciones de «Cuentas pendientes» abiertas (de un hogar, o de todos si p_household es null):
-- de quién es, su saldo, el tuyo, si eres tú quien se fue, y lo último que se ha escrito.
create function public.my_debt_chats(p_household uuid default null)
returns table (
  conversation_id uuid, household_id uuid, household_name text, departed_id uuid, departed_name text,
  departed_avatar text, departed_net_cents bigint, my_net_cents bigint, is_mine boolean, unread integer,
  last_body text, last_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then return; end if;
  return query
    select c.id, h.id, h.name, c.departed_id, pr.display_name, pr.avatar_path,
           public.triqui_net_cents(h.id, c.departed_id), public.triqui_net_cents(h.id, uid), c.departed_id = uid,
           (select count(*)::integer from public.messages ms
            where ms.conversation_id = c.id and ms.sender_id is distinct from uid
              and ms.created_at > coalesce((select r.last_read_at from public.conversation_reads r
                                            where r.conversation_id = c.id and r.user_id = uid), '-infinity'::timestamptz)
              and not exists (select 1 from public.message_hidden hi where hi.message_id = ms.id and hi.user_id = uid)),
           last.body, last.created_at
    from public.household_members me
    join public.conversations c on c.household_id = me.household_id and c.kind = 'debts'
    join public.households h on h.id = c.household_id
    join public.profiles pr on pr.id = c.departed_id
    left join lateral (
      select ms.body, ms.created_at from public.messages ms
      where ms.conversation_id = c.id
        and not exists (select 1 from public.message_hidden hi where hi.message_id = ms.id and hi.user_id = uid)
      order by ms.created_at desc, ms.id desc limit 1
    ) last on true
    where me.user_id = uid and me.role in ('admin', 'member')
      and (p_household is null or h.id = p_household)
      and public.chat_member(c.id, uid)
    order by h.name, pr.display_name, c.id;
end $$;

-- Una conversación de «Cuentas pendientes»: el hogar y quién se fue
create function public.get_debt_chat(p_conversation uuid)
returns table (household_id uuid, household_name text, timezone text, departed_id uuid, departed_name text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.conversations c where c.id = p_conversation and c.kind = 'debts')
     or not public.chat_can_access(p_conversation) then
    raise exception 'Not allowed';
  end if;
  return query
    select h.id, h.name, h.timezone, c.departed_id, pr.display_name
    from public.conversations c
    join public.households h on h.id = c.household_id
    join public.profiles pr on pr.id = c.departed_id
    where c.id = p_conversation;
end $$;

-- Quién está en ella y su saldo en el hogar (para calcular quién paga a quién)
create function public.debt_chat_parties(p_conversation uuid)
returns table (user_id uuid, display_name text, avatar_path text, net_cents bigint, is_departed boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  c public.conversations;
begin
  select * into c from public.conversations where id = p_conversation and kind = 'debts';
  if not found or not public.chat_can_access(p_conversation) then raise exception 'Not allowed'; end if;
  return query
    select m.user_id, pr.display_name, pr.avatar_path, public.triqui_net_cents(c.household_id, m.user_id),
           m.user_id = c.departed_id
    from public.household_members m
    join public.profiles pr on pr.id = m.user_id
    where m.household_id = c.household_id and m.role in ('admin', 'member')
      and (m.user_id = c.departed_id or public.debts_counterpart(c.household_id, c.departed_id, m.user_id))
    order by m.user_id = c.departed_id desc, pr.display_name, m.user_id;
end $$;

-- Pagos pendientes entre quien se fue y las personas de la conversación, y qué puedes hacer con cada uno
create function public.debt_chat_payments(p_conversation uuid)
returns table (
  id uuid, from_user uuid, to_user uuid, amount_cents integer, settled_on date, can_answer boolean, can_cancel boolean
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := (select auth.uid());
  c   public.conversations;
begin
  select * into c from public.conversations where id = p_conversation and kind = 'debts';
  if not found or not public.chat_can_access(p_conversation) then raise exception 'Not allowed'; end if;
  return query
    select st.id, st.from_user, st.to_user, st.amount_cents, st.settled_on,
           public.triqui_can_answer_payment(st), st.from_user = uid
    from public.settlements st
    where st.household_id = c.household_id and st.status = 'pending'
      and c.departed_id in (st.from_user, st.to_user)
      and public.debts_counterpart(c.household_id, c.departed_id,
                                   case when st.from_user = c.departed_id then st.to_user else st.from_user end)
    order by st.settled_on desc, st.created_at desc;
end $$;

-- ═════════════ 7. Avisos de mensajes ═════════════
-- Igual que en la migración 14, pero el aviso de un mensaje de «Cuentas pendientes» lleva a esa conversación
create or replace function public.messages_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.conversations;
  r uuid;
begin
  select * into c from public.conversations where id = new.conversation_id;
  if c.household_id is null then return null; end if;
  for r in
    select m.user_id from public.household_members m
    where m.household_id = c.household_id and m.user_id is distinct from new.sender_id
      and public.chat_member(new.conversation_id, m.user_id)
  loop
    perform public.notify(r, c.household_id, 'message', new.sender_id, new.conversation_id,
      jsonb_build_object('body', left(new.body, 160)),
      case when c.kind = 'debts' then '/cuentas-pendientes/' || c.id else '/hogar/' || c.household_id || '/chat' end,
      null, false);
  end loop;
  return null;
end $$;

-- ═════════════ 8. Permisos de ejecución ═════════════
revoke execute on function public.debts_open(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.debts_counterpart(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.debts_pair(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.debts_create_chat() from public, anon, authenticated;
revoke execute on function public.my_debt_chats(uuid) from public, anon;
revoke execute on function public.get_debt_chat(uuid) from public, anon;
revoke execute on function public.debt_chat_parties(uuid) from public, anon;
revoke execute on function public.debt_chat_payments(uuid) from public, anon;
grant execute on function public.my_debt_chats(uuid) to authenticated;
grant execute on function public.get_debt_chat(uuid) to authenticated;
grant execute on function public.debt_chat_parties(uuid) to authenticated;
grant execute on function public.debt_chat_payments(uuid) to authenticated;
