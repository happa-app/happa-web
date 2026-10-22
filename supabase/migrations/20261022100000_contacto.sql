-- HAPPA · Migración 20: contacto (errores, dudas e ideas que nos mandáis desde Más → Ayuda y contacto)
--
-- Reglas:
--   · Cada mensaje tiene un tipo (error, pregunta, idea u otro), el texto y, para entenderlo mejor, el hogar
--     desde el que se escribe (si se escribe desde uno), el idioma y el móvil o navegador.
--   · Solo se escriben con send_contact_message: así la fecha, quién lo manda y el estado los pone el servidor,
--     y nadie puede mandar más de 5 en una hora.
--   · Cada persona solo ve los suyos. El equipo los lee en private.contact_inbox (SQL Editor de Supabase) y
--     va cambiando el estado: 'new' (nuevo) → 'read' (leído) → 'done' (resuelto).
--   · Al borrar la cuenta se borran sus mensajes. Los que tienen más de 2 años los borra
--     privacy_choices_purge() (la misma tarea semanal de pg_cron de la migración 19).

-- ═════════════ 1. Tabla ═════════════
create table public.contact_messages (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('bug', 'question', 'idea', 'other')),
  message      text not null check (char_length(btrim(message)) between 1 and 2000),
  household_id uuid references public.households (id) on delete set null,
  locale       text not null check (locale in ('es', 'en')),
  user_agent   text check (char_length(user_agent) <= 300),
  status       text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at   timestamptz not null default now()
);
-- Para el límite por hora y para la bandeja (los más nuevos primero)
create index contact_messages_user_idx on public.contact_messages (user_id, created_at desc);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;
revoke insert, update, delete on public.contact_messages from anon, authenticated;
create policy "contact_messages_select_own" on public.contact_messages for select to authenticated
  using (user_id = (select auth.uid()));

-- ═════════════ 2. Mandar un mensaje ═════════════
create function public.send_contact_message(
  p_kind       text,
  p_message    text,
  p_household  uuid default null,
  p_locale     text default 'es',
  p_user_agent text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_text  text := btrim(coalesce(p_message, ''));
  v_house uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = uid and deleted_at is null) then
    raise exception 'Not authenticated';
  end if;
  if p_kind is null or p_kind not in ('bug', 'question', 'idea', 'other') then raise exception 'Invalid contact kind'; end if;
  if char_length(v_text) not between 1 and 2000 then raise exception 'Invalid contact message'; end if;
  if (select count(*) from public.contact_messages
      where user_id = uid and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many contact messages';
  end if;
  -- El hogar solo se guarda si de verdad eres de él
  if p_household is not null and public.is_household_member(p_household) then v_house := p_household; end if;

  insert into public.contact_messages (user_id, kind, message, household_id, locale, user_agent)
  values (uid, p_kind, v_text, v_house,
          case when p_locale in ('es', 'en') then p_locale else 'es' end,
          left(nullif(btrim(coalesce(p_user_agent, '')), ''), 300));
end $$;

revoke execute on function public.send_contact_message(text, text, uuid, text, text) from public, anon;
grant  execute on function public.send_contact_message(text, text, uuid, text, text) to authenticated;

-- ═════════════ 3. Bandeja (solo administración) ═════════════
-- Para leerlos en el SQL Editor:   select * from private.contact_inbox;
-- Para marcar uno como resuelto:   update public.contact_messages set status = 'done' where id = 12;
create view private.contact_inbox as
select
  c.id,
  c.created_at,
  c.status,
  c.kind,
  c.message,
  p.display_name as name,
  u.email,
  c.locale,
  h.name         as household,
  c.user_agent
from public.contact_messages c
join public.profiles p on p.id = c.user_id
left join auth.users u on u.id = c.user_id
left join public.households h on h.id = c.household_id
order by c.created_at desc;

revoke all on private.contact_inbox from public, anon, authenticated;

-- ═════════════ 4. Al borrar la cuenta ═════════════
-- Igual que en la migración 18 (perfil), y además se borran sus mensajes de contacto. El perfil no se borra
-- (se queda como «Usuario eliminado»), así que el "on delete cascade" de la tabla no basta.
create or replace function public.handle_deleted_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in select household_id from public.household_members
           where user_id = old.id and left_at is null loop
    perform public.depart_member(r.household_id, old.id, null);
  end loop;

  delete from public.guardianships where guardian_id = old.id or minor_id = old.id;
  -- Lo que era solo suyo
  delete from public.notifications where user_id = old.id;
  delete from public.notification_preferences where user_id = old.id;
  delete from public.push_subscriptions where user_id = old.id;
  delete from public.shopping_items where owner_id = old.id;
  delete from public.message_hidden where user_id = old.id;
  delete from public.conversation_reads where user_id = old.id;
  delete from public.contact_messages where user_id = old.id;
  -- En los avisos de los demás, su nombre deja de salir
  update public.notifications set data = data || jsonb_build_object('actor', 'Usuario eliminado')
  where actor_id = old.id and data ? 'actor';

  update public.profiles
  set display_name = 'Usuario eliminado', avatar_path = null, deleted_at = now()
  where id = old.id;

  return old;
end $$;

-- ═════════════ 5. Borrado a los 2 años ═════════════
-- Igual que en la migración 19, y además borra los mensajes de contacto de hace más de 2 años.
create or replace function public.privacy_choices_purge() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_choices integer;
  v_legal   integer;
  v_contact integer;
begin
  delete from public.privacy_choices c
  using public.profiles p
  where p.id = c.user_id and p.deleted_at is not null and p.deleted_at < now() - interval '3 years';
  get diagnostics v_choices = row_count;

  delete from public.legal_consents c
  using public.profiles p
  where p.id = c.user_id and p.deleted_at is not null and p.deleted_at < now() - interval '3 years';
  get diagnostics v_legal = row_count;

  delete from public.contact_messages where created_at < now() - interval '2 years';
  get diagnostics v_contact = row_count;

  return v_choices + v_legal + v_contact;
end $$;

revoke execute on function public.privacy_choices_purge() from public, anon, authenticated;
