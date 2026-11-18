-- HAPPA · Migración 26: los hogares archivados se borran del todo (política de privacidad, apartado 6)
--
-- Reglas:
--   · Un hogar se archiva cuando sale la última persona adulta (migración 2) y desde entonces nadie lo ve.
--     Hasta ahora se quedaba guardado para siempre; la purga a los 30 días que anunciaba la migración 2 no se
--     llegó a programar.
--   · Ahora, pasados 30 días desde que se archivó, el hogar se borra con todo lo que contiene (chat, gastos, pagos,
--     tareas, horarios, lista de la compra, ruleta, avisos...): todas esas tablas cuelgan del hogar con
--     "on delete cascade".
--   · Excepción: si entre quienes vivieron en él quedan saldos pendientes, se espera a que se salden (esos datos
--     son la prueba de las cuentas y los usará la conversación «Cuentas pendientes»). Como mucho, 5 años desde que
--     se archivó: el plazo para reclamar deudas entre particulares (art. 1964.2 del Código Civil).
--   · Lo hace la misma tarea semanal de pg_cron que la purga de privacidad (migraciones 19 y 20): no hay que
--     programar nada nuevo. Si aún no está programada en la BD oficial, en el SQL Editor:
--       select cron.schedule('privacidad-purga', '30 4 * * 0', 'select public.privacy_choices_purge()');

-- ═════════════ 1. Borrar los hogares archivados ═════════════
-- Devuelve cuántos hogares ha borrado. No se puede llamar desde la app.
create function public.archived_households_purge() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  delete from public.households h
  where h.archived_at is not null
    and (
      h.archived_at < now() - interval '5 years'
      or (
        h.archived_at < now() - interval '30 days'
        -- Nadie de los que vivieron en él (también los que se fueron antes) tiene saldo distinto de cero
        and not exists (
          select 1 from public.household_members m
          where m.household_id = h.id and public.triqui_net_cents(h.id, m.user_id) <> 0
        )
      )
    );
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke execute on function public.archived_households_purge() from public, anon, authenticated;

-- ═════════════ 2. La purga semanal también borra los hogares ═════════════
-- Igual que en la migración 20, y además llama a archived_households_purge()
create or replace function public.privacy_choices_purge() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_choices    integer;
  v_legal      integer;
  v_contact    integer;
  v_households integer;
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

  v_households := public.archived_households_purge();

  return v_choices + v_legal + v_contact + v_households;
end $$;

revoke execute on function public.privacy_choices_purge() from public, anon, authenticated;
