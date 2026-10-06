-- HAPPA · Migración 18: el perfil (tu foto, tus números y borrar tu cuenta)
--
--   · Foto: se sube al almacén "avatars" de Supabase, en una carpeta con tu id (solo tú escribes en ella).
--     El perfil guarda la ruta (avatar_path), no una dirección cualquiera: así nadie puede poner de foto
--     una imagen de otra web. Los menores no tienen foto.
--   · Idioma: ya se podía cambiar (profiles.locale). Lo usan los avisos al móvil.
--   · Tus números: tareas hechas, lo que has pagado en gastos, mensajes y veces que te tocó la ruleta.
--   · Borrar tu cuenta: no se puede si debes dinero ni con gastos o pagos sin confirmar en algún hogar.
--     Sales de tus hogares, se borra lo tuyo (avisos, móviles, lista personal...) y en lo compartido
--     (gastos, chat) quedas como "Usuario eliminado", para que a los demás les sigan cuadrando las cuentas.
--     Pide haber escrito la contraseña hace un momento, y la foto la borra la app antes (Supabase no deja
--     borrar archivos desde SQL).
--   · Una cuenta borrada ya no puede cambiar su perfil ni volver a un hogar (su sesión aún vale un rato).

-- ═════════════ 1. Foto de perfil ═════════════
-- avatar_url (una dirección cualquiera) se sustituye por la ruta dentro del almacén
alter table public.profiles drop constraint profiles_avatar_https;
alter table public.profiles drop column avatar_url;
alter table public.profiles
  add column avatar_path text,
  -- Siempre en tu carpeta, con un nombre al azar (cada foto nueva, un nombre nuevo) y nunca de un menor
  add constraint profiles_avatar_path_valid check (
    avatar_path is null
    or (not is_minor and avatar_path ~ ('^' || id::text || '/[A-Za-z0-9_-]{8,64}\.(webp|jpg)$'))
  );
grant update (avatar_path) on public.profiles to authenticated;

-- El almacén: público para ver (la dirección lleva tu id y un nombre al azar), solo imágenes pequeñas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ¿Puede esta cuenta subir una foto? Adulta, no borrada y con menos de 5 archivos en su carpeta
-- (la app borra las viejas al poner una nueva: así nadie usa el almacén para otra cosa)
create function public.can_have_avatar() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and not is_minor and deleted_at is null
  ) and (
    select count(*) from storage.objects
    where bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) < 5;
$$;

-- Cada uno, solo en su carpeta: subir, ver la lista y borrar (sin carpetas dentro)
create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and public.can_have_avatar()
  );
create policy "avatars_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- En el chat, la foto de cada uno (la función devuelve una columna más: hay que crearla de nuevo)
drop function public.chat_people(uuid);
create function public.chat_people(p_conversation uuid)
returns table (user_id uuid, display_name text, is_member boolean, avatar_path text)
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
    select pe.uid, pr.display_name, public.chat_member(p_conversation, pe.uid), pr.avatar_path
    from people pe
    join public.profiles pr on pr.id = pe.uid
    where public.chat_member(p_conversation, pe.uid)
       or exists (select 1 from public.messages ms where ms.conversation_id = p_conversation and ms.sender_id = pe.uid)
    order by pr.display_name, pe.uid;
end $$;
revoke execute on function public.chat_people(uuid) from public, anon;
grant execute on function public.chat_people(uuid) to authenticated;

-- ═════════════ 2. Tus números ═════════════
-- Lo tuyo en todos tus hogares (también en los que dejaste): solo cuenta lo que has hecho tú.
create function public.get_my_stats()
returns table (member_since timestamptz, chores_done integer, paid_cents bigint, messages_sent integer, roulette_chosen integer)
language sql stable security definer set search_path = '' as $$
  select
    p.created_at,
    (select count(*)::integer from public.chore_occurrences o where o.done_by = p.id and o.status = 'done'),
    coalesce((select sum(ep.amount_cents) from public.expense_payers ep
              join public.expenses e on e.id = ep.expense_id
              where ep.user_id = p.id and e.status = 'confirmed' and e.deleted_at is null), 0)::bigint,
    (select count(*)::integer from public.messages ms where ms.sender_id = p.id),
    (select count(*)::integer from public.roulette_spins s where s.chosen_id = p.id)
  from public.profiles p
  where p.id = (select auth.uid()) and p.deleted_at is null;
$$;

-- ═════════════ 3. Borrar tu cuenta ═════════════
-- Gastos y pagos de una persona que aún esperan confirmación en un hogar. Si alguien los confirmara
-- después de borrar la cuenta, podría quedar una deuda que ya nadie podría cobrar.
create function public.triqui_pending_count(p_household uuid, p_user uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select (
    (select count(*) from public.expenses e
     where e.household_id = p_household and e.status = 'pending' and e.deleted_at is null
       and (exists (select 1 from public.expense_payers p where p.expense_id = e.id and p.user_id = p_user)
            or exists (select 1 from public.expense_shares s where s.expense_id = e.id and s.user_id = p_user)))
    + (select count(*) from public.settlements st
       where st.household_id = p_household and st.status = 'pending' and p_user in (st.from_user, st.to_user))
  )::integer;
$$;

-- Antes de borrar: en qué hogares (actuales o que dejaste) tienes saldo (negativo = debes; positivo =
-- te deben) o cosas sin confirmar
create function public.my_pending_balances()
returns table (household_id uuid, name text, net_cents bigint, pending integer)
language sql stable security definer set search_path = '' as $$
  select h.id, h.name, x.net, x.pending
  from public.household_members m
  join public.households h on h.id = m.household_id
  cross join lateral (
    select public.triqui_net_cents(h.id, m.user_id) as net, public.triqui_pending_count(h.id, m.user_id) as pending
  ) x
  where m.user_id = (select auth.uid()) and m.role in ('admin', 'member')
    and (x.net <> 0 or x.pending > 0)
  order by h.name, h.id;
$$;

-- ¿Ha escrito su contraseña hace un momento? (la app la vuelve a pedir justo antes de borrar: así no
-- basta con encontrar una sesión abierta)
create function public.signed_in_recently(p_minutes integer default 10) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(jsonb_typeof((select auth.jwt()) -> 'amr') = 'array', false) and exists (
    select 1 from jsonb_array_elements((select auth.jwt()) -> 'amr') a
    where a ->> 'method' = 'password'
      and jsonb_typeof(a -> 'timestamp') = 'number'
      and (a ->> 'timestamp')::numeric > extract(epoch from now()) - p_minutes * 60
  );
$$;

-- Borrar la cuenta propia. Lo demás lo hace el disparador al borrar el usuario (handle_deleted_user).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid       uuid := (select auth.uid());
  v_minor   boolean;
  v_deleted timestamptz;
  r         record;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor, deleted_at into v_minor, v_deleted from public.profiles where id = uid for update;
  if not found or v_deleted is not null then raise exception 'Account not found'; end if;
  -- La de un menor se pide a privacidad@happa.es
  if v_minor then raise exception 'Minor accounts cannot delete themselves'; end if;
  if not public.signed_in_recently() then raise exception 'Recent password required'; end if;

  -- Sale ya de sus hogares: al salir se apuntan los gastos fijos que tocaban
  for r in select household_id from public.household_members where user_id = uid and left_at is null loop
    perform public.depart_member(r.household_id, uid, null);
  end loop;
  -- Con todo apuntado: ni deudas ni nada a medias (si no, se deshace todo lo anterior)
  if exists (select 1 from public.my_pending_balances() where net_cents < 0) then
    raise exception 'You owe money';
  end if;
  if exists (select 1 from public.my_pending_balances() where pending > 0) then
    raise exception 'Pending money';
  end if;
  -- Y la foto, borrada antes por la app (con la API del almacén: desde SQL no se puede)
  if exists (select 1 from storage.objects
             where bucket_id = 'avatars' and (storage.foldername(name))[1] = uid::text) then
    raise exception 'Remove photos first';
  end if;

  delete from auth.users where id = uid;
end $$;

-- Una cuenta borrada aún tiene su sesión un rato (hasta una hora): que no pueda devolver su nombre al
-- perfil ni volver a entrar en un hogar
drop policy "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and deleted_at is null)
  with check (id = (select auth.uid()) and deleted_at is null);
drop policy "profiles_update_guardian" on public.profiles;
create policy "profiles_update_guardian" on public.profiles for update to authenticated
  using (public.is_guardian_of(id) and deleted_at is null)
  with check (public.is_guardian_of(id) and deleted_at is null);

create function public.enforce_member_not_deleted() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.left_at is null and exists (select 1 from public.profiles where id = new.user_id and deleted_at is not null) then
    raise exception 'Deleted accounts cannot join households';
  end if;
  return new;
end $$;
create trigger household_members_not_deleted before insert or update on public.household_members
  for each row execute function public.enforce_member_not_deleted();

-- Al borrar un usuario (desde la app o desde el panel de Supabase): fuera de sus hogares, fuera lo
-- suyo y el perfil se queda como "Usuario eliminado"
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
  -- En los avisos de los demás, su nombre deja de salir
  update public.notifications set data = data || jsonb_build_object('actor', 'Usuario eliminado')
  where actor_id = old.id and data ? 'actor';

  update public.profiles
  set display_name = 'Usuario eliminado', avatar_path = null, deleted_at = now()
  where id = old.id;

  return old;
end $$;

-- ═════════════ 4. Permisos ═════════════
revoke execute on function public.can_have_avatar() from public, anon;
revoke execute on function public.get_my_stats() from public, anon;
revoke execute on function public.my_pending_balances() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
revoke execute on function public.triqui_pending_count(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.signed_in_recently(integer) from public, anon, authenticated;
revoke execute on function public.enforce_member_not_deleted() from public, anon, authenticated;
grant execute on function public.can_have_avatar() to authenticated;
grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.my_pending_balances() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
