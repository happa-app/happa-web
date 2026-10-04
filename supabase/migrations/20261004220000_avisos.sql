-- HAPPA · Migración 14: avisos (en la app y en el móvil)
--
-- Reglas:
--   · Los avisos se crean solos, aquí en la base de datos, cuando pasa algo que te toca:
--       gastos:  te han apuntado un gasto o un gasto fijo que tienes que confirmar, te han rechazado uno
--                tuyo, alguien dice que te ha pagado;
--       compra:  alguien ha añadido cosas a la lista del hogar (varias seguidas van en un solo aviso);
--       tareas:  te han pasado un día, dicen que una tuya no está hecha, un menor espera tu visto bueno,
--                te han dado el visto bueno;
--       chat:    un mensaje nuevo (este solo va al móvil: en la app ya tienes el contador del chat).
--   · Nunca te avisa de lo que haces tú. Lo ya resuelto (confirmaste el gasto, el pago ya está
--     contestado, otro adulto dio el visto bueno) se marca como leído solo.
--   · Al móvil (push) solo si lo has activado en ese móvil y no has apagado ese tipo de avisos.
--     Los envía el servidor de la app (Next.js) con un secreto que solo conocen la app y la base de
--     datos (no hace falta la clave service_role). Las direcciones de envío solo pueden ser de los
--     servicios de push de los navegadores (Google, Mozilla, Apple, Microsoft).

-- ═════════════ 1. Tablas ═════════════
create type public.notification_type as enum (
  'expense_to_confirm', 'expense_rejected', 'payment_to_confirm', 'recurring_to_confirm',
  'shopping_added',
  'chore_reassigned', 'chore_reopened', 'chore_to_approve', 'chore_approved',
  'message'
);
create type public.notification_category as enum ('expenses', 'shopping', 'chores', 'chat');
-- none: no va al móvil · pending: por enviar · sent: enviado · failed: no se pudo (o caducó)
create type public.push_state as enum ('none', 'pending', 'sent', 'failed');

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  -- A quién le llega
  user_id      uuid not null references public.profiles (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  type         public.notification_type not null,
  -- Quién lo hizo
  actor_id     uuid references public.profiles (id) on delete set null,
  -- De qué es (el gasto, el pago, el día de la tarea, el chat...)
  ref_id       uuid,
  -- Lo necesario para escribir el texto (con los nombres de ese momento)
  data         jsonb not null default '{}',
  -- Adónde lleva, dentro de la app (sin el idioma)
  url          text not null constraint notifications_url check (url ~ '^/[a-z0-9/_-]*$'),
  -- Sale en la campana (los mensajes del chat no)
  in_app       boolean not null default true,
  -- Para no avisar dos veces de lo mismo
  dedupe_key   text,
  read_at      timestamptz,
  push_state   public.push_state not null default 'none',
  created_at   timestamptz not null default clock_timestamp(),
  updated_at   timestamptz not null default clock_timestamp(),
  constraint notifications_dedupe unique (user_id, dedupe_key)
);
create index notifications_user_idx on public.notifications (user_id, created_at desc) where in_app;
create index notifications_push_idx on public.notifications (created_at) where push_state = 'pending';
create index notifications_ref_idx on public.notifications (ref_id, type);
create index notifications_household_idx on public.notifications (household_id);
create index notifications_actor_idx on public.notifications (actor_id);

-- Qué avisos quieres en el móvil (sin fila = sí)
create table public.notification_preferences (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  push     boolean not null default true,
  primary key (user_id, category)
);

-- Los móviles y navegadores donde has activado los avisos
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  endpoint     text not null unique constraint push_subscriptions_endpoint_length check (char_length(endpoint) <= 1000),
  p256dh       text not null constraint push_subscriptions_p256dh check (p256dh ~ '^[A-Za-z0-9_-]{86,88}$'),
  auth         text not null constraint push_subscriptions_auth check (auth ~ '^[A-Za-z0-9_-]{22,24}$'),
  -- Idioma de ese móvil (los avisos se escriben en él)
  locale       text not null default 'es' constraint push_subscriptions_locale check (locale in ('es', 'en')),
  created_at   timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Secretos que solo conoce la base de datos (este esquema no lo ve la API)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.secrets (
  name  text primary key,
  value text not null
);
revoke all on private.secrets from public, anon, authenticated;

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.notifications, public.notification_preferences, public.push_subscriptions from anon, authenticated;
grant select on public.notifications, public.notification_preferences, public.push_subscriptions to authenticated;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "notifications_select_own" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notification_preferences_select_own" on public.notification_preferences for select to authenticated
  using (user_id = (select auth.uid()));
create policy "push_subscriptions_select_own" on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- ═════════════ 2. Crear avisos (funciones internas) ═════════════
create function public.notification_category_of(p_type public.notification_type) returns public.notification_category
language sql immutable set search_path = '' as $$
  select case
    when p_type in ('expense_to_confirm', 'expense_rejected', 'payment_to_confirm', 'recurring_to_confirm') then 'expenses'
    when p_type = 'shopping_added' then 'shopping'
    when p_type = 'message' then 'chat'
    else 'chores'
  end::public.notification_category;
$$;

-- Crea un aviso para p_user (nunca para quien hace la acción). Añade a los datos el nombre de quien
-- lo hizo y el del hogar. Devuelve el id, o null si no hacía falta.
create function public.notify(
  p_user uuid, p_household uuid, p_type public.notification_type, p_actor uuid, p_ref uuid,
  p_data jsonb, p_url text, p_dedupe text default null, p_in_app boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_push boolean;
  v_id   uuid;
begin
  if p_user is null or p_user is not distinct from p_actor then return null; end if;
  -- Cuentas borradas: nada
  if not exists (select 1 from public.profiles where id = p_user and deleted_at is null) then return null; end if;

  v_push := coalesce((select push from public.notification_preferences
                      where user_id = p_user and category = public.notification_category_of(p_type)), true)
            and exists (select 1 from public.push_subscriptions where user_id = p_user);
  -- Lo que solo iría al móvil, si no va al móvil, no se guarda
  if not p_in_app and not v_push then return null; end if;

  insert into public.notifications (user_id, household_id, type, actor_id, ref_id, data, url, in_app, dedupe_key, push_state)
  values (
    p_user, p_household, p_type, p_actor, p_ref,
    coalesce(p_data, '{}'::jsonb)
      || jsonb_build_object(
           'actor', (select display_name from public.profiles where id = p_actor),
           'household', (select name from public.households where id = p_household)),
    p_url, p_in_app, p_dedupe,
    case when v_push then 'pending' else 'none' end::public.push_state
  )
  on conflict (user_id, dedupe_key) do nothing
  returning id into v_id;
  return v_id;
end $$;

-- Da por leídos los avisos de algo que ya se ha resuelto (de todos, o solo de p_user)
create function public.notifications_resolve(p_type public.notification_type, p_ref uuid, p_user uuid default null)
returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = clock_timestamp(), updated_at = clock_timestamp()
  where ref_id = p_ref and type = p_type and read_at is null and (p_user is null or user_id = p_user);
$$;

-- ═════════════ 3. Gastos ═════════════
-- Al terminar cada cambio (por eso "deferrable initially deferred": se mira cómo ha quedado el gasto
-- al final, con quién paga, el reparto y las confirmaciones ya guardados).
create function public.expenses_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  e   public.expenses;
  uid uuid := (select auth.uid());
  p   uuid;
begin
  select * into e from public.expenses where id = new.id;
  if not found then return null; end if;

  if e.deleted_at is not null or e.status <> 'pending' then
    perform public.notifications_resolve('expense_to_confirm', e.id);
  end if;

  if e.deleted_at is null and e.status = 'pending' then
    for p in
      select x.user_id from (
        select user_id from public.expense_payers where expense_id = e.id
        union
        select user_id from public.expense_shares where expense_id = e.id
      ) x
      where not exists (select 1 from public.expense_confirmations c where c.expense_id = e.id and c.user_id = x.user_id)
    loop
      perform public.notify(p, e.household_id, 'expense_to_confirm', uid, e.id,
        jsonb_build_object('description', e.description, 'amount_cents', e.amount_cents, 'edited', e.version > 1),
        '/hogar/' || e.household_id || '/gastos/' || e.id, 'expense:' || e.id || ':' || e.version);
    end loop;
  end if;

  if tg_op = 'UPDATE' and new.status = 'rejected' and old.status <> 'rejected' and e.deleted_at is null then
    perform public.notify(e.created_by, e.household_id, 'expense_rejected', coalesce(e.rejected_by, uid), e.id,
      jsonb_build_object('description', e.description, 'amount_cents', e.amount_cents, 'reason', e.rejected_reason),
      '/hogar/' || e.household_id || '/gastos/' || e.id, 'expense-rejected:' || e.id || ':' || e.version);
  end if;
  return null;
end $$;
create constraint trigger expenses_notify
  after insert or update on public.expenses
  deferrable initially deferred
  for each row execute function public.expenses_notify();

-- Al confirmar, tu aviso de ese gasto queda leído
create function public.expense_confirmations_resolve() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notifications_resolve('expense_to_confirm', new.expense_id, new.user_id);
  return null;
end $$;
create trigger expense_confirmations_resolve
  after insert on public.expense_confirmations
  for each row execute function public.expense_confirmations_resolve();

-- Pagos: quien recibe tiene que confirmarlo
create function public.settlements_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.notify(new.to_user, new.household_id, 'payment_to_confirm', (select auth.uid()), new.id,
      jsonb_build_object('amount_cents', new.amount_cents),
      '/hogar/' || new.household_id || '/gastos', 'payment:' || new.id);
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    perform public.notifications_resolve('payment_to_confirm', new.id);
  end if;
  return null;
end $$;
create trigger settlements_notify
  after insert or update of status on public.settlements
  for each row execute function public.settlements_notify();

-- Gastos fijos que hay que confirmar
create function public.recurring_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r   public.recurring_expenses;
  uid uuid := (select auth.uid());
  p   uuid;
begin
  select * into r from public.recurring_expenses where id = new.id;
  if not found then return null; end if;
  if r.status <> 'pending' then
    perform public.notifications_resolve('recurring_to_confirm', r.id);
    return null;
  end if;
  for p in
    select x.user_id from (
      select r.paid_by as user_id
      union
      select user_id from public.recurring_expense_shares where recurring_id = r.id
    ) x
    where not exists (select 1 from public.recurring_expense_confirmations c where c.recurring_id = r.id and c.user_id = x.user_id)
  loop
    perform public.notify(p, r.household_id, 'recurring_to_confirm', uid, r.id,
      jsonb_build_object('description', r.description, 'amount_cents', r.amount_cents),
      '/hogar/' || r.household_id || '/gastos/fijos', 'recurring:' || r.id || ':' || r.version);
  end loop;
  return null;
end $$;
create constraint trigger recurring_notify
  after insert or update on public.recurring_expenses
  deferrable initially deferred
  for each row execute function public.recurring_notify();

create function public.recurring_confirmations_resolve() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notifications_resolve('recurring_to_confirm', new.recurring_id, new.user_id);
  return null;
end $$;
create trigger recurring_confirmations_resolve
  after insert on public.recurring_expense_confirmations
  for each row execute function public.recurring_confirmations_resolve();

-- ═════════════ 4. Lista de la compra ═════════════
-- Algo nuevo en la lista del hogar: aviso a los demás que viven ahí. Si quien añade sigue añadiendo
-- (en la misma hora y sin que lo hayas leído), se suma al aviso que ya tienes en vez de mandar otro.
create function public.shopping_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := coalesce((select auth.uid()), new.requested_by);
  r   uuid;
begin
  if new.household_id is null then return null; end if;
  if tg_op = 'UPDATE' and old.household_id is not distinct from new.household_id then return null; end if;

  for r in
    select m.user_id from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = new.household_id and m.role in ('admin', 'member', 'minor')
      and m.left_at is null and h.archived_at is null and m.user_id is distinct from uid
  loop
    update public.notifications n
    set data = jsonb_set(
                 jsonb_set(n.data, '{count}', to_jsonb(coalesce((n.data ->> 'count')::integer, 1) + 1)),
                 '{names}',
                 case when jsonb_array_length(coalesce(n.data -> 'names', '[]'::jsonb)) < 3
                      then coalesce(n.data -> 'names', '[]'::jsonb) || to_jsonb(new.name)
                      else n.data -> 'names' end),
        updated_at = clock_timestamp()
    where n.user_id = r and n.type = 'shopping_added' and n.household_id = new.household_id
      and n.actor_id is not distinct from uid and n.read_at is null
      and n.created_at > clock_timestamp() - interval '1 hour';
    if not found then
      perform public.notify(r, new.household_id, 'shopping_added', uid, new.household_id,
        jsonb_build_object('count', 1, 'names', jsonb_build_array(new.name)),
        '/hogar/' || new.household_id || '/compra');
    end if;
  end loop;
  return null;
end $$;
create trigger shopping_notify
  after insert or update of household_id on public.shopping_items
  for each row execute function public.shopping_notify();

-- ═════════════ 5. Tareas ═════════════
create function public.chores_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_title text;
  v_url   text := '/hogar/' || new.household_id || '/tareas/dia/' || new.id;
  v_data  jsonb;
  a       uuid;
begin
  select title into v_title from public.chores where id = new.chore_id;
  v_data := jsonb_build_object('title', v_title, 'due_on', new.due_on);

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
create trigger chores_notify
  after update of assignee_id, status on public.chore_occurrences
  for each row execute function public.chores_notify();

-- ═════════════ 6. Chat ═════════════
-- Un mensaje: a quienes están en el chat, menos quien escribe. Solo al móvil.
create function public.messages_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_household uuid;
  r           uuid;
begin
  select household_id into v_household from public.conversations where id = new.conversation_id;
  if v_household is null then return null; end if;
  for r in
    select m.user_id from public.household_members m
    where m.household_id = v_household and m.user_id is distinct from new.sender_id
      and public.chat_member(new.conversation_id, m.user_id)
  loop
    perform public.notify(r, v_household, 'message', new.sender_id, new.conversation_id,
      jsonb_build_object('body', left(new.body, 160)),
      '/hogar/' || v_household || '/chat', null, false);
  end loop;
  return null;
end $$;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.messages_notify();

-- ═════════════ 7. Funciones de la app (RPC) ═════════════
-- Marcar como leídos: unos (p_ids) o todos los tuyos (sin p_ids)
create function public.mark_notifications_read(p_ids uuid[] default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  update public.notifications set read_at = clock_timestamp(), updated_at = clock_timestamp()
  where user_id = uid and read_at is null and (p_ids is null or id = any (p_ids));
end $$;

-- Encender o apagar un tipo de avisos en el móvil
create function public.set_notification_preference(p_category public.notification_category, p_push boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_category is null or p_push is null then raise exception 'Invalid preference'; end if;
  insert into public.notification_preferences (user_id, category, push) values (uid, p_category, p_push)
  on conflict (user_id, category) do update set push = excluded.push;
end $$;

-- ¿Es la dirección de un servicio de push de los navegadores? (así nadie puede hacer que la app
-- mande peticiones a otras direcciones)
create function public.push_endpoint_allowed(p_endpoint text) returns boolean
language sql immutable set search_path = '' as $$
  select p_endpoint ~ ('^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|'
                       || '[a-z0-9.-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[A-Za-z0-9/_:.%~=+?&!*-]+$');
$$;

-- Activar los avisos en este móvil o navegador. Si ese navegador ya estaba apuntado (por ejemplo,
-- con otra cuenta), pasa a ser de quien lo apunta ahora. Como mucho 10 por persona.
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_locale text default 'es')
returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_endpoint is null or not public.push_endpoint_allowed(p_endpoint) then raise exception 'Invalid push endpoint'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, locale)
  values (uid, p_endpoint, p_p256dh, p_auth, case when p_locale = 'en' then 'en' else 'es' end)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, locale = excluded.locale,
        last_seen_at = clock_timestamp();
  delete from public.push_subscriptions
  where user_id = uid and id not in (
    select id from public.push_subscriptions where user_id = uid order by last_seen_at desc, created_at desc limit 10
  );
end $$;

-- Desactivar los avisos en este móvil o navegador
create function public.delete_push_subscription(p_endpoint text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = uid;
end $$;

-- ═════════════ 8. Envío al móvil (lo usa el servidor de la app, con el secreto) ═════════════
create function public.push_secret_ok(p_secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_secret is not null and char_length(p_secret) >= 32
     and exists (select 1 from private.secrets where name = 'push_dispatch' and value = p_secret);
$$;

-- Coge avisos pendientes de enviar (cada uno, una sola vez aunque se llame a la vez desde dos sitios)
-- y devuelve, para cada móvil de su destinatario, lo necesario para enviarlo.
-- Los del chat se borran al cogerlos (no salen en la campana); lo de hace más de un día ya no se envía.
create function public.push_claim(p_secret text, p_limit integer default 50)
returns table (
  notification_id uuid, type public.notification_type, data jsonb, url text, ref_id uuid,
  endpoint text, p256dh text, auth text, locale text
)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.push_secret_ok(p_secret) then raise exception 'Not allowed'; end if;

  delete from public.notifications n
  where n.push_state = 'pending' and n.type = 'message' and n.created_at < clock_timestamp() - interval '1 day';
  update public.notifications n set push_state = 'failed'
  where n.push_state = 'pending' and n.created_at < clock_timestamp() - interval '1 day';

  return query
    with picked as (
      select n.id from public.notifications n
      where n.push_state = 'pending'
      order by n.created_at
      limit least(greatest(coalesce(p_limit, 50), 1), 200)
      for update skip locked
    ),
    sent as (
      update public.notifications n set push_state = 'sent', updated_at = clock_timestamp()
      from picked where n.id = picked.id and n.type <> 'message'
      returning n.id, n.user_id, n.type, n.data, n.url, n.ref_id
    ),
    chat as (
      delete from public.notifications n
      using picked where n.id = picked.id and n.type = 'message'
      returning n.id, n.user_id, n.type, n.data, n.url, n.ref_id
    ),
    claimed as (select * from sent union all select * from chat)
    select c.id, c.type, c.data, c.url, c.ref_id, s.endpoint, s.p256dh, s.auth, s.locale
    from claimed c
    join public.push_subscriptions s on s.user_id = c.user_id
    order by c.id;
end $$;

-- Olvida los móviles que el servicio de push dice que ya no existen
create function public.push_forget(p_secret text, p_endpoints text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.push_secret_ok(p_secret) then raise exception 'Not allowed'; end if;
  delete from public.push_subscriptions where endpoint = any (p_endpoints);
end $$;

-- ═════════════ 9. Permisos de ejecución ═════════════
revoke execute on function public.notification_category_of(public.notification_type) from public, anon, authenticated;
revoke execute on function public.notify(uuid, uuid, public.notification_type, uuid, uuid, jsonb, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.notifications_resolve(public.notification_type, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.expenses_notify() from public, anon, authenticated;
revoke execute on function public.expense_confirmations_resolve() from public, anon, authenticated;
revoke execute on function public.settlements_notify() from public, anon, authenticated;
revoke execute on function public.recurring_notify() from public, anon, authenticated;
revoke execute on function public.recurring_confirmations_resolve() from public, anon, authenticated;
revoke execute on function public.shopping_notify() from public, anon, authenticated;
revoke execute on function public.chores_notify() from public, anon, authenticated;
revoke execute on function public.messages_notify() from public, anon, authenticated;
revoke execute on function public.push_secret_ok(text) from public, anon, authenticated;
revoke execute on function public.push_endpoint_allowed(text) from public, anon, authenticated;

revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
revoke execute on function public.set_notification_preference(public.notification_category, boolean) from public, anon;
revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
revoke execute on function public.delete_push_subscription(text) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
grant execute on function public.set_notification_preference(public.notification_category, boolean) to authenticated;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;

-- El servidor de la app llama a estas con la clave pública (anon) y el secreto
revoke execute on function public.push_claim(text, integer) from public;
revoke execute on function public.push_forget(text, text[]) from public;
grant execute on function public.push_claim(text, integer) to anon, authenticated;
grant execute on function public.push_forget(text, text[]) to anon, authenticated;

-- ═════════════ 10. Después de aplicar esta migración ═════════════
-- Pon el secreto del envío (el mismo valor que PUSH_DISPATCH_SECRET en .env.local / Vercel), una vez,
-- en Supabase → SQL Editor:
--   insert into private.secrets (name, value) values ('push_dispatch', 'EL_SECRETO')
--   on conflict (name) do update set value = excluded.value;
