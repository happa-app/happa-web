-- HAPPA · Migración 27: se puede borrar la cuenta aunque haya deudas o cosas sin confirmar
--
-- Reglas (Términos 11.1 y Privacidad 9):
--   · Antes (migración 18), delete_my_account no dejaba borrar la cuenta a quien debía dinero ('You owe money') o
--     tenía gastos o pagos sin confirmar ('Pending money'). El RGPD no permite condicionar el derecho a borrar los
--     propios datos a que se pague a los compañeros: ahora la app solo avisa antes de confirmar.
--   · Lo que queda se resuelve sin la persona:
--       - los saldos siguen apuntados para el resto del hogar a nombre de «Usuario eliminado»;
--       - un gasto sin confirmar lo puede dar por bueno un admin del hogar (force_confirm_expense);
--       - un pago que tenía que confirmar ella lo puede confirmar un admin (triqui_can_answer_payment ya admite
--         cuentas borradas).
--   · Lo demás no cambia: sale de sus hogares (y se apuntan los gastos fijos que tocaban), la foto la borra antes la
--     app y el disparador handle_deleted_user deja el perfil como «Usuario eliminado».

create or replace function public.delete_my_account() returns void
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
  -- Y la foto, borrada antes por la app (con la API del almacén: desde SQL no se puede)
  if exists (select 1 from storage.objects
             where bucket_id = 'avatars' and (storage.foldername(name))[1] = uid::text) then
    raise exception 'Remove photos first';
  end if;

  delete from auth.users where id = uid;
end $$;
