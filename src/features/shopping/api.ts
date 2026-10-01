// Acceso a la tabla shopping_items. Recibe el cliente de Supabase como parámetro,
// así sirve igual en el servidor (primera carga) y en el navegador (cambios en vivo).
// Los permisos los aplica RLS en la base de datos (migración 6).
import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { ShoppingItem, ShoppingScope } from "./types";

const ITEM_FIELDS =
  "id, name, quantity, checked_at, created_at, requested_by, requester:profiles!shopping_items_requested_by_fkey(display_name)";

type ItemRow = {
  id: string;
  name: string;
  quantity: number;
  checked_at: string | null;
  created_at: string;
  requested_by: string | null;
  requester: { display_name: string } | null;
};

function toItem(row: ItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    requestedBy: row.requested_by,
    requestedByName: row.requester?.display_name ?? null,
  };
}

export async function fetchItems(supabase: AppSupabaseClient, scope: ShoppingScope): Promise<ShoppingItem[]> {
  const base = supabase.from("shopping_items").select(ITEM_FIELDS);
  const filtered =
    scope.type === "household" ? base.eq("household_id", scope.householdId) : base.eq("owner_id", scope.userId);
  const { data, error } = await filtered.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toItem);
}

export async function insertItem(
  supabase: AppSupabaseClient,
  scope: ShoppingScope,
  item: { name: string; quantity: number },
) {
  const target =
    scope.type === "household" ? { household_id: scope.householdId } : { owner_id: scope.userId };
  const { error } = await supabase.from("shopping_items").insert({ ...target, ...item });
  if (error) throw error;
}

export async function setChecked(supabase: AppSupabaseClient, itemId: string, checked: boolean) {
  // La fecha real y quién lo compró las pone la base de datos.
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked_at: checked ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw error;
}

export async function deleteItems(supabase: AppSupabaseClient, itemIds: string[]) {
  if (itemIds.length === 0) return;
  const { error } = await supabase.from("shopping_items").delete().in("id", itemIds);
  if (error) throw error;
}

export async function shareItem(supabase: AppSupabaseClient, itemId: string, householdId: string) {
  const { error } = await supabase.rpc("share_shopping_item", { p_item: itemId, p_household: householdId });
  if (error) throw error;
}
