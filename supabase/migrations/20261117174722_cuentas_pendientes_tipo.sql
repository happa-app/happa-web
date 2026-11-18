-- HAPPA · Migración 28: tipo de conversación «Cuentas pendientes»
--
-- Va sola porque Postgres no deja usar un valor nuevo de un enum en la misma transacción en que se añade:
-- la migración 29 ya lo usa (tablas, índices y funciones).
alter type public.conversation_kind add value if not exists 'debts';
