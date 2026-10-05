-- HAPPA · Migración 15: plazas del hogar (cuántas personas pueden vivir en él)
--
-- Cada hogar tiene un máximo de personas (max_members, de 1 a 20). Cuentan quienes viven en él:
-- admin, miembros y menores; el casero no. Con el hogar lleno, el código de invitación no deja
-- entrar a nadie más. Se elige al crear el hogar y el admin lo puede cambiar, pero nunca por
-- debajo de las personas que ya viven en él.
--
-- Cambia:
--   · households.max_members (nueva columna). A los hogares que ya existen se les pone lo normal
--     para su tipo (pareja 2, familia 6, pisos 4), o las personas que ya tienen si son más.
--   · create_household: recibe las plazas (p_max_members; si no llegan, lo normal para el tipo).
--   · join_household: con el hogar lleno, "Household is full".
--   · set_household_max_members (nueva): el admin cambia las plazas.
--   · get_invite_preview: dice también cuántas plazas tiene el hogar.

-- ───────────── Columna ─────────────
alter table public.households add column max_members smallint;

update public.households h
set max_members = least(20, greatest(
  case h.kind when 'couple' then 2 when 'family' then 6 else 4 end,
  (select count(*) from public.household_members m
    where m.household_id = h.id and m.left_at is null and m.role <> 'landlord')
));

alter table public.households
  alter column max_members set not null,
  alter column max_members set default 4,
  add constraint households_max_members_range check (max_members between 1 and 20);

comment on column public.households.max_members is
  'Cuántas personas pueden vivir en el hogar (sin contar al casero). Solo se cambia con set_household_max_members.';

-- Personas que viven en el hogar ahora mismo (las que ocupan plaza)
create function public.household_resident_count(p_household uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.household_members m
  where m.household_id = p_household and m.left_at is null and m.role <> 'landlord';
$$;
revoke execute on function public.household_resident_count(uuid) from public, anon, authenticated;

-- Lo normal para cada tipo de hogar, si no se dice nada
create function public.household_default_places(p_kind public.household_kind) returns smallint
language sql immutable set search_path = '' as $$
  select (case p_kind when 'couple' then 2 when 'family' then 6 else 4 end)::smallint;
$$;
revoke execute on function public.household_default_places(public.household_kind) from public, anon, authenticated;

-- ───────────── Crear un hogar (con plazas) ─────────────
drop function public.create_household(text, public.household_kind);

create function public.create_household(
  p_name        text,
  p_kind        public.household_kind default 'shared_flat',
  p_max_members integer default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
  v_tz    text;
  v_max   integer := coalesce(p_max_members, public.household_default_places(p_kind));
  hid     uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor, timezone into v_minor, v_tz from public.profiles where id = uid;
  if coalesce(v_minor, false) then raise exception 'Minor accounts cannot create households'; end if;
  if v_max < 1 or v_max > 20 then raise exception 'Places must be between 1 and 20'; end if;

  insert into public.households (name, kind, created_by, timezone, max_members)
  values (p_name, p_kind, uid, coalesce(v_tz, 'Europe/Madrid'), v_max)
  returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, uid, 'admin');
  return hid;
end $$;

revoke execute on function public.create_household(text, public.household_kind, integer) from public, anon;
grant  execute on function public.create_household(text, public.household_kind, integer) to authenticated;

-- ───────────── Unirse con código (si queda sitio) ─────────────
-- Igual que antes (no vale para hogares archivados ni para menores; quien se fue y vuelve recupera
-- su fila), y además: con el hogar lleno no entra nadie. Se bloquea la fila del hogar para que dos
-- personas que se unen a la vez no ocupen la misma plaza.
create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
  v_max   integer;
  hid     uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor into v_minor from public.profiles where id = uid;
  if coalesce(v_minor, false) then raise exception 'Minor accounts are added by their guardian'; end if;

  select id, max_members into hid, v_max from public.households
  where invite_code = p_code and archived_at is null
  for update;
  if hid is null then raise exception 'Invalid invite code'; end if;

  -- Ya estás dentro: no cambia nada
  if exists (select 1 from public.household_members
             where household_id = hid and user_id = uid and left_at is null) then
    return hid;
  end if;

  if public.household_resident_count(hid) >= v_max then raise exception 'Household is full'; end if;

  insert into public.household_members (household_id, user_id) values (hid, uid)
  on conflict (household_id, user_id) do update
    set left_at = null, role = 'member', joined_at = now()
    where public.household_members.left_at is not null;
  return hid;
end $$;

-- ───────────── Cambiar las plazas (solo admin) ─────────────
create function public.set_household_max_members(p_household uuid, p_max_members integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_admin(p_household) then raise exception 'Only an admin can change the places'; end if;
  if p_max_members is null or p_max_members < 1 or p_max_members > 20 then
    raise exception 'Places must be between 1 and 20';
  end if;

  perform 1 from public.households where id = p_household for update;
  if p_max_members < public.household_resident_count(p_household) then
    raise exception 'Fewer places than people living here';
  end if;
  update public.households set max_members = p_max_members where id = p_household;
end $$;

revoke execute on function public.set_household_max_members(uuid, integer) from public, anon;
grant  execute on function public.set_household_max_members(uuid, integer) to authenticated;

-- ───────────── Ver una invitación (con las plazas) ─────────────
-- Cambia lo que devuelve, así que hay que borrarla y crearla otra vez.
drop function public.get_invite_preview(text);

create function public.get_invite_preview(p_code text)
returns table (
  household_id   uuid,
  name           text,
  kind           public.household_kind,
  member_count   integer,
  max_members    integer,
  already_member boolean
)
language sql stable security definer set search_path = '' as $$
  select
    h.id,
    h.name,
    h.kind,
    public.household_resident_count(h.id),
    h.max_members::integer,
    exists (select 1 from public.household_members m
      where m.household_id = h.id and m.user_id = (select auth.uid()) and m.left_at is null)
  from public.households h
  where h.invite_code = p_code
    and h.archived_at is null
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.get_invite_preview(text) from public, anon;
grant  execute on function public.get_invite_preview(text) to authenticated;
