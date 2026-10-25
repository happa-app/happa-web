-- HAPPA · Migración 23: confirmar con Google lo delicado (borrar la cuenta)
--
-- Quien entra con Google no tiene contraseña de HAPPA, así que no puede volver a escribirla antes de borrar
-- su cuenta. Para él, la confirmación es volver a entrar con Google justo antes: la sesión que abre Google
-- queda marcada como "oauth" (igual que la de la contraseña queda como "password").

-- ¿Ha confirmado que es él hace un momento? Igual que en la migración 18, y además vale haber entrado con
-- Google (o con otro proveedor) en esos minutos.
create or replace function public.signed_in_recently(p_minutes integer default 10) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(jsonb_typeof((select auth.jwt()) -> 'amr') = 'array', false) and exists (
    select 1 from jsonb_array_elements((select auth.jwt()) -> 'amr') a
    where a ->> 'method' in ('password', 'oauth')
      and jsonb_typeof(a -> 'timestamp') = 'number'
      and (a ->> 'timestamp')::numeric > extract(epoch from now()) - p_minutes * 60
  );
$$;

revoke execute on function public.signed_in_recently(integer) from public, anon, authenticated;
