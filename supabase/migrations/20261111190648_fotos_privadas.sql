-- HAPPA · Migración 24: fotos de perfil privadas
--
--   · El almacén "avatars" deja de ser público: hasta ahora cualquiera con la dirección exacta podía abrir
--     una foto. La política de privacidad dice que solo la ven las personas de tus hogares.
--   · Puedes ver una foto si es tuya, si compartes con esa persona un hogar (sin haber salido y sin
--     archivar) o si los dos estáis en el chat de un hogar (quien se fue debiendo dinero sigue en el chat).
--   · La app ya no enlaza al almacén: pide la foto a /api/avatar/..., que la descarga con tu sesión
--     (así se aplica esta política) y deja que el navegador la guarde un día.
--   · Subir, ver la lista y borrar las tuyas sigue igual (migración 18).

update storage.buckets set public = false where id = 'avatars';

-- ¿Puede quien hace la consulta ver la foto de esta persona? (p_owner es el nombre de la carpeta: el id
-- en texto. Se compara como texto para no fallar si alguien pide una carpeta que no es un id)
create function public.can_see_avatar(p_owner text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    -- La tuya
    p_owner = (select auth.uid())::text
    -- Compartís un hogar ahora mismo
    or exists (
      select 1
      from public.household_members yo
      join public.household_members otro on otro.household_id = yo.household_id
      join public.households h on h.id = yo.household_id
      where yo.user_id = (select auth.uid()) and yo.left_at is null
        and otro.user_id::text = p_owner and otro.left_at is null
        and h.archived_at is null
    )
    -- Estáis los dos en el chat de un hogar (por ejemplo, quien se fue con saldo pendiente)
    or exists (
      select 1
      from public.conversations c
      join public.household_members otro on otro.household_id = c.household_id
      where otro.user_id::text = p_owner
        and public.chat_member(c.id, (select auth.uid()))
        and public.chat_member(c.id, otro.user_id)
    )
  );
$$;
revoke execute on function public.can_see_avatar(text) from public, anon;
grant execute on function public.can_see_avatar(text) to authenticated;

-- Ver (descargar) la foto de alguien de tus hogares. Se suma a "avatars_select_own" (basta con una)
create policy "avatars_select_household" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.can_see_avatar((storage.foldername(name))[1]));
