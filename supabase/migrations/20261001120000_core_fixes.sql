-- HAPPA · Migración 3: arreglos del núcleo, menores y consentimientos legales
-- Se crea con: npx supabase migration new core_fixes  (y se pega este contenido)
--
-- Qué cambia:
--   1. Perfiles: zona horaria, cuentas de menor, borrado con anonimización y columnas protegidas.
--   2. Hogares: tipo "piso de estudiantes", zona horaria, archivado y columnas protegidas.
--   3. Miembros: roles de menor y casero, salida sin borrar historial, y cambios solo por funciones.
--   4. Tablas nuevas: tutelas de menores y consentimientos legales.
--
-- Nota técnica: los valores nuevos de los tipos (student_flat, minor, landlord) no se usan
-- en este archivo como tales, porque PostgreSQL no deja usarlos en la misma transacción
-- en la que se crean. Donde hace falta se comparan como texto.

-- ═════════════ 1. Tipos ═════════════
alter type public.household_kind add value if not exists 'student_flat' after 'shared_flat';
alter type public.household_role add value if not exists 'minor';
alter type public.household_role add value if not exists 'landlord';

-- ═════════════ 2. Utilidad: zona horaria válida ═════════════
create function public.is_valid_timezone(tz text) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

-- ═════════════ 3. Perfiles ═════════════
alter table public.profiles
  add column timezone   text not null default 'Europe/Madrid'
                        constraint profiles_timezone_valid check (public.is_valid_timezone(timezone)),
  add column is_minor   boolean not null default false,
  add column deleted_at timestamptz,
  add constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 60),
  add constraint profiles_avatar_https check (avatar_url is null or avatar_url like 'https://%');

-- El perfil ya no se borra al borrar la cuenta: se anonimiza (ver handle_deleted_user).
-- Así los gastos y el historial de los demás siguen cuadrando.
alter table public.profiles drop constraint profiles_id_fkey;

-- Cada usuario solo puede editar estas columnas de su perfil.
-- account_type, is_minor y deleted_at quedan fuera de su alcance.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, locale, timezone) on public.profiles to authenticated;

-- Al registrarse, la zona horaria se toma de los metadatos si es válida.
-- is_minor y account_type NUNCA se leen de los metadatos (los controla el usuario).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz text := new.raw_user_meta_data ->> 'timezone';
begin
  insert into public.profiles (id, display_name, locale, timezone)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 60),
    case when new.raw_user_meta_data ->> 'locale' in ('es', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'es' end,
    case when v_tz is not null and public.is_valid_timezone(v_tz) then v_tz else 'Europe/Madrid' end
  );
  return new;
end $$;

-- ═════════════ 4. Hogares ═════════════
alter table public.households
  add column timezone    text not null default 'Europe/Madrid'
                         constraint households_timezone_valid check (public.is_valid_timezone(timezone)),
  add column archived_at timestamptz;

-- Poder borrar del todo la cuenta de quien creó el hogar (derecho de supresión del RGPD).
alter table public.households alter column created_by drop not null;
alter table public.households drop constraint households_created_by_fkey;
alter table public.households
  add constraint households_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- El admin solo puede editar estas columnas. El código de invitación se cambia
-- con regenerate_invite_code. La moneda se bloqueará cuando existan gastos (migración del triqui).
revoke insert, update, delete on public.households from anon, authenticated;
grant update (name, kind, currency, timezone) on public.households to authenticated;

-- Un hogar ya no se borra desde la app: se archiva cuando no quedan adultos.
-- La purga a los 30 días se programará en la migración del triqui, que ya puede comprobar deudas.
drop policy "households_delete_admin" on public.households;

-- ═════════════ 5. Miembros ═════════════
alter table public.household_members add column left_at timestamptz;
create index household_members_active_idx on public.household_members (user_id) where left_at is null;

-- Las membresías solo cambian mediante funciones (crear, unirse, salir, expulsar, cambiar rol).
-- Antes un admin podía editar cualquier columna de una membresía, incluido user_id.
drop policy "members_update_admin" on public.household_members;
drop policy "members_delete_self_or_admin" on public.household_members;
revoke insert, update, delete on public.household_members from anon, authenticated;

-- Coherencia entre el perfil y el rol: una cuenta de menor solo puede tener el rol de menor, y al revés.
create function public.enforce_membership_role() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_minor boolean;
begin
  select is_minor into v_minor from public.profiles where id = new.user_id;
  if coalesce(v_minor, false) and new.role::text <> 'minor' then
    raise exception 'A minor account can only have the minor role';
  end if;
  if not coalesce(v_minor, false) and new.role::text = 'minor' then
    raise exception 'Only minor accounts can have the minor role';
  end if;
  return new;
end $$;
create trigger household_members_role_consistency before insert or update on public.household_members
  for each row execute function public.enforce_membership_role();

-- ═════════════ 6. Tutelas de menores ═════════════
create table public.guardianships (
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  minor_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (guardian_id, minor_id),
  constraint guardianships_not_self check (guardian_id <> minor_id)
);
create index guardianships_minor_idx on public.guardianships (minor_id);

create function public.enforce_guardianship() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles
                 where id = new.guardian_id and not is_minor and account_type = 'resident' and deleted_at is null) then
    raise exception 'The guardian must be an adult resident account';
  end if;
  if not exists (select 1 from public.profiles where id = new.minor_id and is_minor) then
    raise exception 'The tutored account must be a minor account';
  end if;
  return new;
end $$;
create trigger guardianships_check before insert or update on public.guardianships
  for each row execute function public.enforce_guardianship();

alter table public.guardianships enable row level security;
-- Se crean desde el servidor al dar de alta a un menor; la app solo las lee.
revoke insert, update, delete on public.guardianships from anon, authenticated;
create policy "guardianships_select_own" on public.guardianships for select to authenticated
  using (guardian_id = (select auth.uid()) or minor_id = (select auth.uid()));

-- ═════════════ 7. Consentimientos legales ═════════════
create table public.legal_consents (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  accepted_by uuid not null references public.profiles (id) on delete cascade, -- el tutor, si es un menor
  document    text not null check (document in ('terms', 'privacy', 'cookies', 'parental')),
  version     text not null check (char_length(version) between 1 and 20),
  accepted_at timestamptz not null default now(),
  unique (user_id, document, version)
);
create index legal_consents_accepted_by_idx on public.legal_consents (accepted_by);

alter table public.legal_consents enable row level security;
-- Solo se insertan con accept_legal_document, para que la fecha la ponga el servidor.
revoke insert, update, delete on public.legal_consents from anon, authenticated;
create policy "legal_consents_select_own" on public.legal_consents for select to authenticated
  using (user_id = (select auth.uid()) or accepted_by = (select auth.uid()));

-- ═════════════ 8. Funciones de permisos (las usan las políticas RLS) ═════════════
-- Ahora solo cuentan las membresías activas (sin left_at) en hogares no archivados.
create or replace function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = hid and m.user_id = (select auth.uid())
      and m.left_at is null and h.archived_at is null
  );
$$;

create or replace function public.is_household_admin(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = hid and m.user_id = (select auth.uid())
      and m.role = 'admin' and m.left_at is null and h.archived_at is null
  );
$$;

-- Adulto del hogar (admin o miembro): lo usarán gastos, tareas y demás módulos que no son para menores.
create function public.is_household_adult(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = hid and m.user_id = (select auth.uid())
      and m.role in ('admin', 'member') and m.left_at is null and h.archived_at is null
  );
$$;

create or replace function public.shares_household_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    join public.households h on h.id = me.household_id
    where me.user_id = (select auth.uid()) and them.user_id = other
      and me.left_at is null and them.left_at is null and h.archived_at is null
  );
$$;

create function public.is_guardian_of(p_minor uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.guardianships
    where guardian_id = (select auth.uid()) and minor_id = p_minor
  );
$$;

-- Ves el perfil de: los miembros (actuales o pasados) de tus hogares activos,
-- para que el historial muestre nombres, y tus tutores o menores tutelados.
create function public.can_see_profile(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    join public.households h on h.id = me.household_id
    where me.user_id = (select auth.uid()) and them.user_id = other
      and me.left_at is null and h.archived_at is null
  ) or exists (
    select 1 from public.guardianships g
    where (g.guardian_id = (select auth.uid()) and g.minor_id = other)
       or (g.minor_id = (select auth.uid()) and g.guardian_id = other)
  );
$$;

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.can_see_profile(id));

-- El tutor puede editar el nombre, la foto, el idioma y la zona horaria de su menor.
create policy "profiles_update_guardian" on public.profiles for update to authenticated
  using (public.is_guardian_of(id)) with check (public.is_guardian_of(id));

-- ═════════════ 9. Salida de un miembro (interna, no se llama desde la app) ═════════════
-- Marca la salida y aplica la regla de sucesión:
--   el último admin pasa el rol al sucesor elegido o, si no hay, al adulto más antiguo;
--   nunca a un menor ni al casero. Si no quedan adultos, el hogar se archiva.
create function public.depart_member(p_household uuid, p_user uuid, p_successor uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role public.household_role;
  v_next uuid;
begin
  -- Bloquea el hogar para que dos salidas a la vez no lo dejen sin admin.
  perform 1 from public.households where id = p_household for update;

  select role into v_role from public.household_members
  where household_id = p_household and user_id = p_user and left_at is null;
  if not found then raise exception 'Not an active member of this household'; end if;

  update public.household_members set left_at = now()
  where household_id = p_household and user_id = p_user;

  if v_role = 'admin' and not exists (
    select 1 from public.household_members
    where household_id = p_household and role = 'admin' and left_at is null
  ) then
    if p_successor is not null then
      update public.household_members set role = 'admin'
      where household_id = p_household and user_id = p_successor and left_at is null and role = 'member'
      returning user_id into v_next;
      if v_next is null then raise exception 'The successor must be an active adult member'; end if;
    else
      select user_id into v_next from public.household_members
      where household_id = p_household and left_at is null and role = 'member'
      order by joined_at, user_id
      limit 1;
      if v_next is not null then
        update public.household_members set role = 'admin'
        where household_id = p_household and user_id = v_next;
      end if;
    end if;
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household and left_at is null and role in ('admin', 'member')
  ) then
    update public.households set archived_at = now() where id = p_household and archived_at is null;
  end if;
end $$;

-- ═════════════ 10. Borrado de cuenta: anonimizar en vez de borrar ═════════════
-- La cuenta se borra desde el servidor con la API de administración de Supabase.
-- Este disparador saca a la persona de sus hogares y deja su perfil como "Usuario eliminado".
create function public.handle_deleted_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in select household_id from public.household_members
           where user_id = old.id and left_at is null loop
    perform public.depart_member(r.household_id, old.id, null);
  end loop;

  delete from public.guardianships where guardian_id = old.id or minor_id = old.id;

  update public.profiles
  set display_name = 'Usuario eliminado', avatar_url = null, deleted_at = now()
  where id = old.id;

  return old;
end $$;
create trigger on_auth_user_deleted after delete on auth.users
  for each row execute function public.handle_deleted_user();

-- ═════════════ 11. Funciones de la app (RPC) ═════════════
-- Crear hogar: igual que antes, pero los menores no pueden y el hogar toma la zona horaria del creador.
create or replace function public.create_household(p_name text, p_kind public.household_kind default 'shared_flat')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
  v_tz    text;
  hid     uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor, timezone into v_minor, v_tz from public.profiles where id = uid;
  if coalesce(v_minor, false) then raise exception 'Minor accounts cannot create households'; end if;

  insert into public.households (name, kind, created_by, timezone)
  values (p_name, p_kind, uid, coalesce(v_tz, 'Europe/Madrid'))
  returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, uid, 'admin');
  return hid;
end $$;

-- Unirse con código: no vale para hogares archivados ni para menores (los añade su tutor).
-- Quien se fue y vuelve recupera su fila como miembro, sin perder su historial.
create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
  hid     uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor into v_minor from public.profiles where id = uid;
  if coalesce(v_minor, false) then raise exception 'Minor accounts are added by their guardian'; end if;

  select id into hid from public.households where invite_code = p_code and archived_at is null;
  if hid is null then raise exception 'Invalid invite code'; end if;

  insert into public.household_members (household_id, user_id) values (hid, uid)
  on conflict (household_id, user_id) do update
    set left_at = null, role = 'member', joined_at = now()
    where public.household_members.left_at is not null;
  return hid;
end $$;

-- Salir de un hogar. Si eres el último admin, puedes elegir sucesor.
create function public.leave_household(p_household uuid, p_successor uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  perform public.depart_member(p_household, uid, p_successor);
end $$;

-- Expulsar a alguien (solo admin; para salir uno mismo, leave_household).
create function public.remove_member(p_household uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_admin(p_household) then raise exception 'Only an admin can remove members'; end if;
  if p_user = uid then raise exception 'Use leave_household to leave'; end if;
  perform public.depart_member(p_household, p_user, null);
end $$;

-- Cambiar el rol de un adulto entre admin y miembro (solo admin). Siempre queda al menos un admin.
create function public.set_member_role(p_household uuid, p_user uuid, p_role public.household_role)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid       uuid := (select auth.uid());
  v_current public.household_role;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_admin(p_household) then raise exception 'Only an admin can change roles'; end if;
  if p_role::text not in ('admin', 'member') then raise exception 'Only admin and member can be assigned here'; end if;

  perform 1 from public.households where id = p_household for update;
  select role into v_current from public.household_members
  where household_id = p_household and user_id = p_user and left_at is null;
  if not found then raise exception 'Not an active member of this household'; end if;
  if v_current::text not in ('admin', 'member') then raise exception 'This member''s role cannot be changed here'; end if;

  if v_current = 'admin' and p_role::text = 'member' and not exists (
    select 1 from public.household_members
    where household_id = p_household and role = 'admin' and left_at is null and user_id <> p_user
  ) then
    raise exception 'A household needs at least one admin';
  end if;

  update public.household_members set role = p_role
  where household_id = p_household and user_id = p_user;
end $$;

-- Nuevo código de invitación (solo admin). El anterior deja de valer.
create function public.regenerate_invite_code(p_household uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
begin
  if not public.is_household_admin(p_household) then raise exception 'Only an admin can change the invite code'; end if;
  update public.households set invite_code = v_code where id = p_household;
  return v_code;
end $$;

-- Hogares archivados en los que estuviste como adulto (para poder recuperarlos).
create function public.my_archived_households()
returns table (household_id uuid, name text, archived_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select h.id, h.name, h.archived_at
  from public.households h
  join public.household_members m on m.household_id = h.id
  where m.user_id = (select auth.uid()) and h.archived_at is not null and m.role in ('admin', 'member');
$$;

-- Recuperar un hogar archivado: quien estuvo como adulto vuelve como admin.
create function public.restore_household(p_household uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  perform 1 from public.households where id = p_household and archived_at is not null for update;
  if not found then raise exception 'Household is not archived'; end if;
  if not exists (
    select 1 from public.household_members m
    join public.profiles p on p.id = m.user_id
    where m.household_id = p_household and m.user_id = uid
      and m.role in ('admin', 'member') and not p.is_minor
  ) then
    raise exception 'Only a former adult member can restore this household';
  end if;

  update public.households set archived_at = null where id = p_household;
  update public.household_members set left_at = null, role = 'admin'
  where household_id = p_household and user_id = uid;
end $$;

-- Aceptar los términos, la privacidad o las cookies. La fecha la pone el servidor.
create function public.accept_legal_document(p_document text, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_document not in ('terms', 'privacy', 'cookies') then raise exception 'Unknown document'; end if;
  insert into public.legal_consents (user_id, accepted_by, document, version)
  values (uid, uid, p_document, p_version)
  on conflict (user_id, document, version) do nothing;
end $$;

-- ═════════════ 12. Permisos de ejecución ═════════════
-- Supabase da permiso de ejecución a anon y authenticated por defecto: hay que quitarlo a mano.
revoke execute on function public.depart_member(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_deleted_user() from public, anon, authenticated;
revoke execute on function public.enforce_membership_role() from public, anon, authenticated;
revoke execute on function public.enforce_guardianship() from public, anon, authenticated;

-- Las funciones de permisos solo las necesitan los usuarios con sesión (las políticas son "to authenticated").
revoke execute on function public.is_household_member(uuid) from public, anon;
revoke execute on function public.is_household_admin(uuid) from public, anon;
revoke execute on function public.is_household_adult(uuid) from public, anon;
revoke execute on function public.shares_household_with(uuid) from public, anon;
revoke execute on function public.is_guardian_of(uuid) from public, anon;
revoke execute on function public.can_see_profile(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.is_household_adult(uuid) to authenticated;
grant execute on function public.shares_household_with(uuid) to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
grant execute on function public.can_see_profile(uuid) to authenticated;

revoke execute on function public.leave_household(uuid, uuid) from public, anon;
revoke execute on function public.remove_member(uuid, uuid) from public, anon;
revoke execute on function public.set_member_role(uuid, uuid, public.household_role) from public, anon;
revoke execute on function public.regenerate_invite_code(uuid) from public, anon;
revoke execute on function public.my_archived_households() from public, anon;
revoke execute on function public.restore_household(uuid) from public, anon;
revoke execute on function public.accept_legal_document(text, text) from public, anon;

grant execute on function public.leave_household(uuid, uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, public.household_role) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.my_archived_households() to authenticated;
grant execute on function public.restore_household(uuid) to authenticated;
grant execute on function public.accept_legal_document(text, text) to authenticated;
