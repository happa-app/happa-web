-- HAPPA · Migración 7: la cantidad de la compra pasa a ser un número entero del 1 al 99 (por defecto 1).
--
-- Antes era texto libre ("2 bricks"), y se podían escribir cosas sin sentido. Ahora la app solo deja
-- poner cifras y la base de datos lo exige también.
-- Lo que ya hubiera guardado se convierte así: se queda el número del principio ("2 bricks" → 2);
-- si no empieza por un número, estaba vacío o era 0, pasa a 1; si pasa de 99, se queda en 99.

-- 1) Fuera la regla de longitud del texto (no sirve para un número)
alter table public.shopping_items drop constraint shopping_items_quantity_length;

-- 2) El trigger recortaba los espacios de la cantidad, y eso no funciona con un número: se reescribe
--    igual que en la migración 6, pero sin tocar la cantidad.
create or replace function public.shopping_items_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.name := btrim(new.name);

  if tg_op = 'INSERT' then
    new.requested_by := coalesce((select auth.uid()), new.requested_by);
    new.checked_at := null;
    new.checked_by := null;
  elsif new.checked_at is distinct from old.checked_at then
    if new.checked_at is null then
      new.checked_by := null;
    else
      new.checked_at := now();
      new.checked_by := (select auth.uid());
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

-- 3) Texto → número
alter table public.shopping_items
  alter column quantity type integer using (
    least(99, greatest(1, coalesce(substring(quantity from '^\s*(\d{1,9})')::integer, 1)))
  ),
  alter column quantity set default 1,
  alter column quantity set not null;

alter table public.shopping_items
  add constraint shopping_items_quantity_range check (quantity between 1 and 99);
