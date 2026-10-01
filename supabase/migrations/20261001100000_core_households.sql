-- HAPPA · Migración 1: usuarios, hogares y membresías (con RLS desde el día uno)
-- Se crea con: npx supabase migration new core_households  (y se pega este contenido)

-- ───────────── Tipos ─────────────
create type public.account_type   as enum ('resident', 'professional');
create type public.household_kind as enum ('shared_flat', 'couple', 'family');
create type public.household_role as enum ('admin', 'member');

-- ───────────── Utilidad: updated_at ─────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────── Perfiles (1:1 con auth.users) ─────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  locale       text not null default 'es' check (locale in ('es', 'en')),
  -- 'professional' queda reservado para la fase marketplace
  account_type public.account_type not null default 'resident',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Se crea el perfil automáticamente al registrarse.
-- IMPORTANTE: account_type NUNCA se lee de los metadatos del cliente (los puede manipular el usuario).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'locale' in ('es', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'es' end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Hogares ─────────────
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  kind        public.household_kind not null default 'shared_flat',
  currency    char(3) not null default 'EUR',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_by  uuid not null references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger households_updated_at before update on public.households
  for each row execute function public.set_updated_at();

-- ───────────── Membresías (N:M → un usuario puede estar en varios hogares) ─────────────
create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         public.household_role not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members (user_id);

-- Regla de negocio: un profesional no puede ser miembro de un hogar
create function public.enforce_resident_membership() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and account_type <> 'resident') then
    raise exception 'Professional accounts cannot join households';
  end if;
  return new;
end $$;
create trigger household_members_resident_only before insert on public.household_members
  for each row execute function public.enforce_resident_membership();

-- ───────────── Funciones auxiliares para RLS (security definer evita recursión) ─────────────
create function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = (select auth.uid())
  );
$$;

create function public.is_household_admin(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.shares_household_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them using (household_id)
    where me.user_id = (select auth.uid()) and them.user_id = other
  );
$$;

-- ───────────── RLS ─────────────
alter table public.profiles          enable row level security;
alter table public.households        enable row level security;
alter table public.household_members enable row level security;

-- profiles: te ves a ti mismo y a quien comparte hogar contigo
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_household_with(id));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- (sin insert: lo hace el trigger; sin delete: se borra desde auth)

-- households: solo miembros; la creación va por la función create_household
create policy "households_select" on public.households for select to authenticated
  using (public.is_household_member(id));
create policy "households_update_admin" on public.households for update to authenticated
  using (public.is_household_admin(id)) with check (public.is_household_admin(id));
create policy "households_delete_admin" on public.households for delete to authenticated
  using (public.is_household_admin(id));

-- household_members: ver a los del mismo hogar; salir tú o expulsar un admin
create policy "members_select" on public.household_members for select to authenticated
  using (public.is_household_member(household_id));
create policy "members_update_admin" on public.household_members for update to authenticated
  using (public.is_household_admin(household_id)) with check (public.is_household_admin(household_id));
create policy "members_delete_self_or_admin" on public.household_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_household_admin(household_id));
-- (sin insert directo: solo vía create_household / join_household)

-- ───────────── Funciones de negocio (RPC) ─────────────
create function public.create_household(p_name text, p_kind public.household_kind default 'shared_flat')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  hid uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  insert into public.households (name, kind, created_by) values (p_name, p_kind, uid)
    returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, uid, 'admin');
  return hid;
end $$;

create function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  hid uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select id into hid from public.households where invite_code = p_code;
  if hid is null then raise exception 'Invalid invite code'; end if;
  insert into public.household_members (household_id, user_id) values (hid, uid)
    on conflict do nothing;
  return hid;
end $$;

revoke execute on function public.create_household(text, public.household_kind) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
grant  execute on function public.create_household(text, public.household_kind) to authenticated;
grant  execute on function public.join_household(text) to authenticated;
