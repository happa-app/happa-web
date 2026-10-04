-- HAPPA · Migración 13: chat del hogar (solo texto)
--
-- Reglas:
--   · Cada hogar tiene un chat de inquilinos. Lo usan quienes viven en el hogar (adultos y menores);
--     el casero no (su chat llegará en la fase 2). Quien se va del hogar con saldo pendiente en gastos
--     sigue en el chat hasta saldarlo; quien se va sin deudas deja de verlo.
--   · Para que siempre quede constancia de lo que ha pasado:
--       - Editar: solo tus mensajes y durante 15 minutos desde que lo mandaste. Se marca como editado
--         y cualquiera del chat puede ver lo que ponía antes.
--       - Borrar es "borrar para mí": el mensaje desaparece solo de tu pantalla; los demás lo siguen viendo.
--   · Como mucho 30 mensajes por minuto por persona, y 2.000 letras por mensaje.
--   · Los mensajes llegan en vivo (Supabase Realtime) a quienes pueden leerlos.

-- ═════════════ 1. Tablas ═════════════
-- tenants = inquilinos del hogar · landlord = con el casero (fase 2) · listing = de un anuncio (más adelante)
create type public.conversation_kind as enum ('tenants', 'landlord', 'listing');

create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  kind         public.conversation_kind not null,
  household_id uuid references public.households (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint conversations_household check ((kind in ('tenants', 'landlord')) = (household_id is not null))
);
create unique index conversations_household_kind_idx on public.conversations (household_id, kind)
  where household_id is not null;

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  body            text not null constraint messages_body_length check (char_length(body) between 1 and 2000),
  -- clock_timestamp: la hora exacta (now() es la misma para todo lo que pasa en una transacción)
  created_at      timestamptz not null default clock_timestamp(),
  -- La última vez que se cambió (null = nunca)
  edited_at       timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc, id desc);
create index messages_sender_idx on public.messages (sender_id);

-- Lo que ponía un mensaje antes de cada cambio
create table public.message_edits (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.messages (id) on delete cascade,
  body        text not null,
  -- Cuándo se escribió esa versión y cuándo se cambió
  written_at  timestamptz not null,
  replaced_at timestamptz not null default clock_timestamp()
);
create index message_edits_message_idx on public.message_edits (message_id, replaced_at);

-- "Borrar para mí": mensajes que alguien ha quitado de su pantalla
create table public.message_hidden (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  hidden_at  timestamptz not null default now(),
  primary key (user_id, message_id)
);
create index message_hidden_message_idx on public.message_hidden (message_id);

-- Hasta dónde ha leído cada uno (para los mensajes sin leer)
create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_reads_user_idx on public.conversation_reads (user_id);

-- Solo lectura desde la app; las escrituras van por funciones
revoke all on public.conversations, public.messages, public.message_edits, public.message_hidden,
  public.conversation_reads from anon, authenticated;
grant select on public.conversations, public.messages, public.message_edits, public.message_hidden,
  public.conversation_reads to authenticated;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_edits enable row level security;
alter table public.message_hidden enable row level security;
alter table public.conversation_reads enable row level security;

-- ═════════════ 2. Quién está en un chat ═════════════
-- ¿Puede esta persona leer y escribir en el chat? Del de inquilinos: quien vive en el hogar (adulto o menor),
-- o quien estuvo como adulto y se fue (o se archivó el hogar) con saldo pendiente en gastos.
create function public.chat_member(p_conversation uuid, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  c public.conversations;
begin
  if p_user is null then return false; end if;
  select * into c from public.conversations where id = p_conversation;
  -- De momento solo hay chats de inquilinos
  if not found or c.kind <> 'tenants' then return false; end if;
  return exists (
    select 1 from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = c.household_id and m.user_id = p_user
      and m.role in ('admin', 'member', 'minor') and m.left_at is null and h.archived_at is null
  ) or (
    exists (
      select 1 from public.household_members m
      join public.households h on h.id = m.household_id
      where m.household_id = c.household_id and m.user_id = p_user and m.role in ('admin', 'member')
        and (m.left_at is not null or h.archived_at is not null)
    ) and public.triqui_net_cents(c.household_id, p_user) <> 0
  );
end $$;

-- Lo mismo para quien hace la consulta (lo usan las políticas RLS)
create function public.chat_can_access(p_conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.chat_member(p_conversation, (select auth.uid()));
$$;

create policy "conversations_select" on public.conversations for select to authenticated
  using (public.chat_can_access(id));
-- Los mensajes del chat, menos los que has borrado para ti
create policy "messages_select" on public.messages for select to authenticated
  using (
    public.chat_can_access(conversation_id)
    and not exists (select 1 from public.message_hidden h where h.message_id = id and h.user_id = (select auth.uid()))
  );
create policy "message_edits_select" on public.message_edits for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id));
create policy "message_hidden_select" on public.message_hidden for select to authenticated
  using (user_id = (select auth.uid()));
create policy "conversation_reads_select" on public.conversation_reads for select to authenticated
  using (user_id = (select auth.uid()));

-- ═════════════ 3. Un chat por hogar ═════════════
create function public.households_create_chat() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.conversations (kind, household_id) values ('tenants', new.id)
  on conflict (household_id, kind) where household_id is not null do nothing;
  return new;
end $$;
create trigger households_create_chat
  after insert on public.households
  for each row execute function public.households_create_chat();

-- Los hogares que ya existían
insert into public.conversations (kind, household_id)
select 'tenants', id from public.households
on conflict (household_id, kind) where household_id is not null do nothing;

-- ═════════════ 4. Funciones de la app (RPC) ═════════════
-- El chat de un hogar: su id, el nombre del hogar y si aún vives en él. Sirve también a quien se fue
-- con saldo pendiente (que ya no puede leer la tabla de hogares).
create function public.get_chat(p_household uuid)
returns table (conversation_id uuid, household_name text, timezone text, is_resident boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select c.id into v_id from public.conversations c where c.household_id = p_household and c.kind = 'tenants';
  if v_id is null or not public.chat_can_access(v_id) then raise exception 'Not allowed'; end if;
  return query
    select v_id, h.name, h.timezone, public.is_household_resident(p_household)
    from public.households h where h.id = p_household;
end $$;

-- Nombres de quienes están en el chat y de quienes han escrito alguna vez (aunque ya no estén)
create function public.chat_people(p_conversation uuid)
returns table (user_id uuid, display_name text, is_member boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_household uuid;
begin
  if not public.chat_can_access(p_conversation) then raise exception 'Not allowed'; end if;
  select household_id into v_household from public.conversations where id = p_conversation;
  return query
    with people as (
      select m.user_id as uid from public.household_members m where m.household_id = v_household
      union
      select distinct ms.sender_id from public.messages ms
      where ms.conversation_id = p_conversation and ms.sender_id is not null
    )
    select pe.uid, pr.display_name, public.chat_member(p_conversation, pe.uid)
    from people pe
    join public.profiles pr on pr.id = pe.uid
    where public.chat_member(p_conversation, pe.uid)
       or exists (select 1 from public.messages ms where ms.conversation_id = p_conversation and ms.sender_id = pe.uid)
    order by pr.display_name, pe.uid;
end $$;

-- Mandar un mensaje. Devuelve el mensaje guardado.
create function public.send_message(p_conversation uuid, p_body text) returns public.messages
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_body text := btrim(p_body, E' \t\r\n');
  m      public.messages;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.chat_member(p_conversation, uid) then raise exception 'Not allowed'; end if;
  if v_body is null or v_body = '' then raise exception 'Write a message'; end if;
  if (select count(*) from public.messages
      where conversation_id = p_conversation and sender_id = uid and created_at > clock_timestamp() - interval '1 minute') >= 30 then
    raise exception 'Too many messages';
  end if;

  insert into public.messages (conversation_id, sender_id, body) values (p_conversation, uid, v_body)
  returning * into m;
  -- Quien escribe ya ha leído hasta ahí
  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation, uid, m.created_at)
  on conflict (conversation_id, user_id) do update
    set last_read_at = greatest(public.conversation_reads.last_read_at, excluded.last_read_at);
  return m;
end $$;

-- Cambiar un mensaje tuyo (hasta 15 minutos después de mandarlo). Lo que ponía antes se guarda.
create function public.edit_message(p_message uuid, p_body text) returns public.messages
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_body text := btrim(p_body, E' \t\r\n');
  v_now  timestamptz := clock_timestamp();
  m      public.messages;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into m from public.messages where id = p_message for update;
  if not found or not public.chat_member(m.conversation_id, uid) then raise exception 'Message not found'; end if;
  if m.sender_id is distinct from uid then raise exception 'You can only edit your own messages'; end if;
  if m.created_at < v_now - interval '15 minutes' then raise exception 'Messages can only be edited for 15 minutes'; end if;
  if v_body is null or v_body = '' then raise exception 'Write a message'; end if;
  if v_body = m.body then return m; end if;

  insert into public.message_edits (message_id, body, written_at, replaced_at)
  values (m.id, m.body, coalesce(m.edited_at, m.created_at), v_now);
  update public.messages set body = v_body, edited_at = v_now where id = m.id returning * into m;
  return m;
end $$;

-- "Borrar para mí": quitar un mensaje (tuyo o de otro) de tu pantalla. Los demás lo siguen viendo.
create function public.hide_message(p_message uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_conv uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select conversation_id into v_conv from public.messages where id = p_message;
  if v_conv is null or not public.chat_member(v_conv, uid) then raise exception 'Message not found'; end if;
  insert into public.message_hidden (user_id, message_id) values (uid, p_message) on conflict do nothing;
end $$;

-- Deshacer "borrar para mí"
create function public.unhide_message(p_message uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_conv uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select conversation_id into v_conv from public.messages where id = p_message;
  if v_conv is null or not public.chat_member(v_conv, uid) then raise exception 'Message not found'; end if;
  delete from public.message_hidden where user_id = uid and message_id = p_message;
end $$;

-- Marcar el chat como leído hasta ahora
create function public.mark_chat_read(p_conversation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.chat_member(p_conversation, uid) then raise exception 'Not allowed'; end if;
  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation, uid, clock_timestamp())
  on conflict (conversation_id, user_id) do update
    set last_read_at = greatest(public.conversation_reads.last_read_at, excluded.last_read_at);
end $$;

-- Para la tarjeta del hogar: mensajes sin leer y el último mensaje (que no hayas borrado para ti).
-- Sin filas si no puedes ver el chat.
create function public.chat_summary(p_household uuid)
returns table (conversation_id uuid, unread integer, last_body text, last_sender uuid, last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_id   uuid;
  v_read timestamptz;
begin
  select c.id into v_id from public.conversations c where c.household_id = p_household and c.kind = 'tenants';
  if v_id is null or not public.chat_member(v_id, uid) then return; end if;
  select r.last_read_at into v_read from public.conversation_reads r where r.conversation_id = v_id and r.user_id = uid;
  return query
    with visible as (
      select ms.* from public.messages ms
      where ms.conversation_id = v_id
        and not exists (select 1 from public.message_hidden h where h.message_id = ms.id and h.user_id = uid)
    ),
    last_one as (select * from visible order by created_at desc, id desc limit 1)
    select v_id,
           (select count(*)::integer from visible
            where created_at > coalesce(v_read, '-infinity'::timestamptz) and sender_id is distinct from uid),
           (select body from last_one), (select sender_id from last_one), (select created_at from last_one);
end $$;

-- ═════════════ 5. En vivo ═════════════
alter publication supabase_realtime add table public.messages;

-- ═════════════ 6. Permisos de ejecución ═════════════
revoke execute on function public.chat_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.households_create_chat() from public, anon, authenticated;

revoke execute on function public.chat_can_access(uuid) from public, anon;
revoke execute on function public.get_chat(uuid) from public, anon;
revoke execute on function public.chat_people(uuid) from public, anon;
revoke execute on function public.send_message(uuid, text) from public, anon;
revoke execute on function public.edit_message(uuid, text) from public, anon;
revoke execute on function public.hide_message(uuid) from public, anon;
revoke execute on function public.unhide_message(uuid) from public, anon;
revoke execute on function public.mark_chat_read(uuid) from public, anon;
revoke execute on function public.chat_summary(uuid) from public, anon;

grant execute on function public.chat_can_access(uuid) to authenticated;
grant execute on function public.get_chat(uuid) to authenticated;
grant execute on function public.chat_people(uuid) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.edit_message(uuid, text) to authenticated;
grant execute on function public.hide_message(uuid) to authenticated;
grant execute on function public.unhide_message(uuid) to authenticated;
grant execute on function public.mark_chat_read(uuid) to authenticated;
grant execute on function public.chat_summary(uuid) to authenticated;
