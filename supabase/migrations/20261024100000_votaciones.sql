-- HAPPA · Migración 21: votaciones en el chat del hogar
--
-- Reglas:
--   · Una votación es un mensaje más del chat (messages.kind = 'poll'): sale en orden con los demás, llega
--     en vivo y avisa al móvil como cualquier mensaje. Su texto es "📊 " + la pregunta.
--   · La crea un adulto que vive en el hogar. Al crearla elige si se pueden marcar varias opciones y si
--     pueden votar los menores. Pregunta de hasta 200 caracteres; de 2 a 10 opciones de hasta 80.
--   · Una vez enviada no se puede editar (nadie cambia la pregunta con votos ya puestos). Se puede "borrar
--     para mí", como cualquier mensaje.
--   · Votan quienes viven en el hogar (los menores, solo si esa votación lo permite). Quien se fue y sigue
--     en el chat por tener saldo pendiente la ve, pero no vota.
--   · Los votos son públicos (se ve quién ha votado cada opción) y nunca se cierra: cada persona puede
--     cambiar o quitar su voto cuando quiera. Votar no manda avisos.
--   · En vivo: cada voto toca polls.updated_at, y la app escucha los cambios de polls para recargar esa
--     votación (los borrados de votos no llegan bien por Realtime).

-- ═════════════ 1. Tablas ═════════════
alter table public.messages
  add column kind text not null default 'text' constraint messages_kind check (kind in ('text', 'poll'));

create table public.polls (
  message_id      uuid primary key references public.messages (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  question        text not null constraint polls_question_length check (char_length(question) between 1 and 200),
  multiple        boolean not null default false,
  minors_can_vote boolean not null default false,
  -- Cambia con cada voto (para avisar en vivo)
  updated_at      timestamptz not null default clock_timestamp()
);
create index polls_conversation_idx on public.polls (conversation_id);

create table public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references public.polls (message_id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  label    text not null constraint poll_options_label_length check (char_length(label) between 1 and 80),
  unique (poll_id, position)
);

create table public.poll_votes (
  poll_id    uuid not null references public.polls (message_id) on delete cascade,
  option_id  uuid not null references public.poll_options (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  primary key (option_id, user_id)
);
create index poll_votes_poll_user_idx on public.poll_votes (poll_id, user_id);
create index poll_votes_user_idx on public.poll_votes (user_id);

-- Las ve quien puede leer el chat. Solo se escriben con create_poll y vote_poll.
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
revoke insert, update, delete on public.polls, public.poll_options, public.poll_votes from anon, authenticated;

create policy "polls_select" on public.polls for select to authenticated
  using (public.chat_can_access(conversation_id));
create policy "poll_options_select" on public.poll_options for select to authenticated
  using (exists (select 1 from public.polls p where p.message_id = poll_id));
create policy "poll_votes_select" on public.poll_votes for select to authenticated
  using (exists (select 1 from public.polls p where p.message_id = poll_id));

-- ═════════════ 2. Quién puede crear y votar ═════════════
-- Su papel en el hogar del chat si vive en él ahora (null si no: se fue, el hogar está archivado o no es suyo)
create function public.chat_resident_role(p_conversation uuid, p_user uuid) returns public.household_role
language sql stable security definer set search_path = '' as $$
  select m.role
  from public.conversations c
  join public.household_members m on m.household_id = c.household_id
  join public.households h on h.id = c.household_id
  where c.id = p_conversation and c.kind = 'tenants' and m.user_id = p_user
    and m.left_at is null and h.archived_at is null and m.role in ('admin', 'member', 'minor');
$$;

-- ═════════════ 3. Crear una votación ═════════════
create function public.create_poll(
  p_conversation    uuid,
  p_question        text,
  p_options         text[],
  p_multiple        boolean default false,
  p_minors_can_vote boolean default false
)
returns public.messages language plpgsql security definer set search_path = '' as $$
declare
  uid        uuid := (select auth.uid());
  v_question text := btrim(coalesce(p_question, ''), E' \t\r\n');
  v_options  text[];
  m          public.messages;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if public.chat_resident_role(p_conversation, uid) is distinct from 'admin'
     and public.chat_resident_role(p_conversation, uid) is distinct from 'member' then
    raise exception 'Only adults living in the household can create polls';
  end if;
  if char_length(v_question) not between 1 and 200 then raise exception 'Invalid poll question'; end if;

  -- Las opciones sin espacios de más y sin vacías, en el orden en que se escribieron
  select coalesce(array_agg(o order by n), '{}') into v_options
  from (select btrim(x, E' \t\r\n') as o, n from unnest(coalesce(p_options, '{}')) with ordinality as u(x, n)) s
  where o <> '';
  if cardinality(v_options) not between 2 and 10 then raise exception 'A poll needs between 2 and 10 options'; end if;
  if exists (select 1 from unnest(v_options) o where char_length(o) > 80) then raise exception 'Invalid poll option'; end if;
  if (select count(distinct lower(o)) from unnest(v_options) o) <> cardinality(v_options) then
    raise exception 'Repeated poll option';
  end if;
  -- El mismo límite que los mensajes (migración 13)
  if (select count(*) from public.messages
      where conversation_id = p_conversation and sender_id = uid and created_at > clock_timestamp() - interval '1 minute') >= 30 then
    raise exception 'Too many messages';
  end if;

  insert into public.messages (conversation_id, sender_id, body, kind)
  values (p_conversation, uid, '📊 ' || v_question, 'poll')
  returning * into m;
  insert into public.polls (message_id, conversation_id, question, multiple, minors_can_vote)
  values (m.id, p_conversation, v_question, coalesce(p_multiple, false), coalesce(p_minors_can_vote, false));
  insert into public.poll_options (poll_id, position, label)
  select m.id, n, o from unnest(v_options) with ordinality as u(o, n);

  -- Quien escribe ya ha leído hasta ahí (como en send_message)
  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation, uid, m.created_at)
  on conflict (conversation_id, user_id) do update
    set last_read_at = greatest(public.conversation_reads.last_read_at, excluded.last_read_at);
  return m;
end $$;

-- ═════════════ 4. Votar ═════════════
-- p_options: las opciones que eliges (sustituyen a tu voto anterior). Vacío = quitar tu voto.
create function public.vote_poll(p_poll uuid, p_options uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid       uuid := (select auth.uid());
  p         public.polls;
  v_role    public.household_role;
  v_options uuid[];
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into p from public.polls where message_id = p_poll for update;
  if not found or not public.chat_member(p.conversation_id, uid) then raise exception 'Poll not found'; end if;

  v_role := public.chat_resident_role(p.conversation_id, uid);
  if v_role is null then raise exception 'Only people living in the household can vote'; end if;
  if v_role = 'minor' and not p.minors_can_vote then raise exception 'Minors cannot vote in this poll'; end if;

  select coalesce(array_agg(distinct o), '{}') into v_options from unnest(coalesce(p_options, '{}')) o;
  if exists (select 1 from unnest(v_options) o
             where not exists (select 1 from public.poll_options po where po.id = o and po.poll_id = p_poll)) then
    raise exception 'Invalid poll option';
  end if;
  if not p.multiple and cardinality(v_options) > 1 then raise exception 'Choose only one option'; end if;

  delete from public.poll_votes where poll_id = p_poll and user_id = uid;
  insert into public.poll_votes (poll_id, option_id, user_id)
  select p_poll, o, uid from unnest(v_options) o;
  update public.polls set updated_at = clock_timestamp() where message_id = p_poll;
end $$;

-- ═════════════ 5. Una votación no se edita ═════════════
-- Igual que en la migración 13, y además rechaza las votaciones.
create or replace function public.edit_message(p_message uuid, p_body text) returns public.messages
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
  if m.kind = 'poll' then raise exception 'Polls cannot be edited'; end if;
  if m.created_at < v_now - interval '15 minutes' then raise exception 'Messages can only be edited for 15 minutes'; end if;
  if v_body is null or v_body = '' then raise exception 'Write a message'; end if;
  if v_body = m.body then return m; end if;

  insert into public.message_edits (message_id, body, written_at, replaced_at)
  values (m.id, m.body, coalesce(m.edited_at, m.created_at), v_now);
  update public.messages set body = v_body, edited_at = v_now where id = m.id returning * into m;
  return m;
end $$;

-- ═════════════ 6. En vivo ═════════════
alter publication supabase_realtime add table public.polls;

-- ═════════════ 7. Permisos de ejecución ═════════════
revoke execute on function public.chat_resident_role(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_poll(uuid, text, text[], boolean, boolean) from public, anon;
revoke execute on function public.vote_poll(uuid, uuid[]) from public, anon;
grant execute on function public.create_poll(uuid, text, text[], boolean, boolean) to authenticated;
grant execute on function public.vote_poll(uuid, uuid[]) to authenticated;
