// El hogar de la barra de abajo, leído en el servidor (layout de la zona privada).
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NAV_HOUSEHOLD_COOKIE, pickNavHousehold } from "./household-path";

export type NavHouseholds = {
  // El hogar al que llevan "Inicio", "Ruleta" y "Chat" al abrir la app
  householdId: string | null;
  // Todos los hogares en los que vives ahora (la barra solo usa estos)
  householdIds: string[];
};

export async function getNavHouseholds(): Promise<NavHouseholds> {
  const none = { householdId: null, householdIds: [] };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return none;

  // Hogares en los que vives ahora, del más antiguo al más nuevo
  const { data: rows, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .is("left_at", null)
    .order("joined_at");
  if (error) {
    console.error("[navegación] no se pudieron leer tus hogares:", error);
    return none;
  }

  const householdIds = (rows ?? []).map((r) => r.household_id.toLowerCase());
  const saved = (await cookies()).get(NAV_HOUSEHOLD_COOKIE)?.value;
  return { householdId: pickNavHousehold(saved, householdIds), householdIds };
}
