// Lecturas de la compra para las páginas del servidor (primera carga, sin esperar al navegador).
// Nunca importes este archivo desde un componente con "use client".
import { createClient } from "@/lib/supabase/server";
import { fetchItems } from "./api";
import type { ShoppingItem } from "./types";

export async function getHouseholdShoppingItems(householdId: string): Promise<ShoppingItem[]> {
  return fetchItems(await createClient(), { type: "household", householdId });
}

export async function getPersonalShoppingItems(userId: string): Promise<ShoppingItem[]> {
  return fetchItems(await createClient(), { type: "personal", userId });
}
