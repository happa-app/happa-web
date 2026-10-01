-- HAPPA · Migración 5: ver a qué hogar invita un código antes de unirse
--
-- Las políticas RLS no dejan ver un hogar si no eres miembro. Esta función muestra
-- solo lo imprescindible (nombre, tipo y número de miembros) a quien tenga el código,
-- para que pueda confirmar que se une al hogar correcto. Nunca enseña quiénes son los miembros.

create function public.get_invite_preview(p_code text)
returns table (
  household_id   uuid,
  name           text,
  kind           public.household_kind,
  member_count   integer,
  already_member boolean
)
language sql stable security definer set search_path = '' as $$
  select
    h.id,
    h.name,
    h.kind,
    (select count(*)::integer from public.household_members m
      where m.household_id = h.id and m.left_at is null and m.role <> 'landlord'),
    exists (select 1 from public.household_members m
      where m.household_id = h.id and m.user_id = (select auth.uid()) and m.left_at is null)
  from public.households h
  where h.invite_code = p_code
    and h.archived_at is null
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.get_invite_preview(text) from public, anon;
grant execute on function public.get_invite_preview(text) to authenticated;
