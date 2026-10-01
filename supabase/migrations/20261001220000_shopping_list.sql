-- HAPPA · Migración 6: lista de la compra (común de cada hogar y personal de cada persona), en vivo
--
-- Reglas:
--   · Cada producto está en UNA lista: la común de un hogar (household_id) o la personal de alguien (owner_id).
--   · La lista común la ven y usan los residentes del hogar (admin, miembro y menor); el casero no.
--   · Los adultos pueden marcar, editar y borrar cualquier producto; un menor, solo lo que pidió él.
--   · La lista personal solo la ve su dueño. Al "pedir en casa", el producto pasa a la lista común
--     y queda claro quién lo pidió.
--   · Quién pidió y quién compró lo pone la base de datos, no el móvil (no se puede falsear).

-- ═════════════ Residente del hogar (todos menos el casero) ═════════════
create function public.is_household_resident(hid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = hid and m.user_id = (select auth.uid())
      and m.role in ('admin', 'member', 'minor') and m.left_at is null and h.archived_at is null
  );
$$;
revoke execute on function public.is_household_resident(uuid) from public, anon;
grant execute on function public.is_household_resident(uuid) to authenticated;

-- ═════════════ Tabla ═════════════
create table public.shopping_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  owner_id     uuid references public.profiles (id) on delete cascade,
  name         text not null,
  quantity     text,
  requested_by uuid,
  checked_at   timestamptz,
  checked_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint shopping_items_one_list check ((household_id is null) <> (owner_id is null)),
  constraint shopping_items_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint shopping_items_quantity_length check (quantity is null or char_length(btrim(quantity)) between 1 and 20),
  constraint shopping_items_requested_by_fkey foreign key (requested_by) references public.profiles (id) on delete set null,
  constraint shopping_items_checked_by_fkey foreign key (checked_by) references public.profiles (id) on delete set null
);
create index shopping_items_household_idx on public.shopping_items (household_id, checked_at) where household_id is not null;
create index shopping_items_owner_idx on public.shopping_items (owner_id) where owner_id is not null;
create index shopping_items_requested_by_idx on public.shopping_items (requested_by);
create index shopping_items_checked_by_idx on public.shopping_items (checked_by);

-- Sella quién pidió, quién compró y cuándo. Limpia espacios del nombre y la cantidad.
create function public.shopping_items_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.name := btrim(new.name);
  new.quantity := nullif(btrim(new.quantity), '');

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
create trigger shopping_items_stamp before insert or update on public.shopping_items
  for each row execute function public.shopping_items_stamp();
revoke execute on function public.shopping_items_stamp() from public, anon, authenticated;

-- ═════════════ Permisos por columna ═════════════
-- Desde la app solo se puede escribir esto. requested_by y checked_by los pone el disparador,
-- y mover un producto de lista solo se hace con share_shopping_item.
revoke all on public.shopping_items from anon;
revoke insert, update, delete on public.shopping_items from authenticated;
grant insert (household_id, owner_id, name, quantity) on public.shopping_items to authenticated;
grant update (name, quantity, checked_at) on public.shopping_items to authenticated;
grant delete on public.shopping_items to authenticated;

-- ═════════════ RLS ═════════════
alter table public.shopping_items enable row level security;

create policy "shopping_select" on public.shopping_items for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (household_id is not null and public.is_household_resident(household_id))
  );

create policy "shopping_insert" on public.shopping_items for insert to authenticated
  with check (
    (household_id is null and owner_id = (select auth.uid()))
    or (owner_id is null and household_id is not null and public.is_household_resident(household_id))
  );

create policy "shopping_update" on public.shopping_items for update to authenticated
  using (
    owner_id = (select auth.uid())
    or (household_id is not null and (
      public.is_household_adult(household_id)
      or (public.is_household_resident(household_id) and requested_by = (select auth.uid()))
    ))
  )
  with check (
    owner_id = (select auth.uid())
    or (household_id is not null and (
      public.is_household_adult(household_id)
      or (public.is_household_resident(household_id) and requested_by = (select auth.uid()))
    ))
  );

create policy "shopping_delete" on public.shopping_items for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or (household_id is not null and (
      public.is_household_adult(household_id)
      or (public.is_household_resident(household_id) and requested_by = (select auth.uid()))
    ))
  );

-- ═════════════ Pedir en casa: de la lista personal a la común de un hogar ═════════════
create function public.share_shopping_item(p_item uuid, p_household uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_resident(p_household) then
    raise exception 'Not a member of this household';
  end if;

  update public.shopping_items
     set household_id = p_household, owner_id = null, requested_by = uid,
         checked_at = null, checked_by = null
   where id = p_item and owner_id = uid;
  if not found then raise exception 'Item not found'; end if;
end $$;
revoke execute on function public.share_shopping_item(uuid, uuid) from public, anon;
grant execute on function public.share_shopping_item(uuid, uuid) to authenticated;

-- ═════════════ Tiempo real ═════════════
-- Supabase avisa a los navegadores conectados cuando cambia esta tabla (respetando RLS).
alter publication supabase_realtime add table public.shopping_items;
