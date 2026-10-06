// Lecturas del perfil propio (en el servidor). La base de datos solo deja ver y cambiar lo tuyo.
import { parseLocale } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "./avatar";
import type { MyAccount, MyProfile, MyStats, PendingBalance } from "./types";

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_path, locale, created_at, is_minor")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return {
    userId,
    name: profile.display_name,
    avatarPath: profile.avatar_path,
    avatarUrl: avatarUrl(profile.avatar_path),
    email,
    locale: parseLocale(profile.locale),
    memberSince: profile.created_at,
    isMinor: profile.is_minor,
  };
}

// Tus números en todos tus hogares
export async function getMyStats(): Promise<MyStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_stats");
  if (error) throw error;
  const row = (data ?? [])[0];
  return {
    choresDone: row?.chores_done ?? 0,
    paidCents: Number(row?.paid_cents ?? 0),
    messagesSent: row?.messages_sent ?? 0,
    rouletteChosen: row?.roulette_chosen ?? 0,
  };
}

// Dónde debes o te deben dinero, o tienes algo sin confirmar (antes de borrar la cuenta).
// Antes se apuntan los gastos fijos que ya tocaban en tus hogares, para que el saldo sea el de verdad.
export async function getMyPendingBalances(userId: string): Promise<PendingBalance[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .is("left_at", null)
    .in("role", ["admin", "member"]);
  for (const m of memberships ?? []) {
    const { error: syncError } = await supabase.rpc("sync_recurring_expenses", { p_household: m.household_id });
    if (syncError) console.error("[perfil] no se pudieron poner al día los gastos fijos:", syncError);
  }
  const { data, error } = await supabase.rpc("my_pending_balances");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    householdId: r.household_id,
    name: r.name,
    netCents: Number(r.net_cents),
    pending: Number(r.pending),
  }));
}

// Tu correo (preguntado a Supabase: el de la sesión puede ser el viejo) y el nuevo, si lo estás cambiando
export async function getMyAccount(): Promise<MyAccount> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error("[perfil] no se pudo leer la cuenta:", error);
  return { email: data.user?.email ?? null, newEmail: data.user?.new_email ?? null };
}
