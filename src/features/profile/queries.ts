// Lecturas del perfil propio (en el servidor). La base de datos solo deja ver y cambiar lo tuyo.
import { cache } from "react";
import { PRIVACY_PURPOSES, type PrivacyPurpose } from "@/features/legal/versions";
import { parseLocale } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "./avatar";
import type { MyAccount, MyPrivacyChoices, MyProfile, MyStats, PendingBalance } from "./types";

// cache(): si el layout y la página lo piden en la misma visita, se lee una sola vez (React lo guarda
// solo durante esa petición; en la siguiente se vuelve a leer)
export const getMyProfile = cache(async (): Promise<MyProfile | null> => {
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
});

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
  const [{ data, error }, confirmedWithGoogle] = await Promise.all([
    supabase.auth.getUser(),
    signedInWithGoogleRecently(supabase),
  ]);
  if (error) console.error("[perfil] no se pudo leer la cuenta:", error);
  // Con qué puede entrar (Supabase lo apunta al registrarse o al unir una cuenta de Google)
  const providers = (data.user?.app_metadata?.providers as string[] | undefined) ?? [];
  return {
    email: data.user?.email ?? null,
    newEmail: data.user?.new_email ?? null,
    hasPassword: providers.includes("email"),
    hasGoogle: providers.includes("google"),
    confirmedWithGoogle,
  };
}

// Minutos que vale haber vuelto a entrar con Google para confirmar algo delicado (la base de datos da 10:
// aquí algo menos, para que no caduque justo entre la pantalla y el botón)
const GOOGLE_CONFIRM_MINUTES = 8;

// ¿La sesión de este navegador se abrió con Google hace un momento? Lo dice el token, firmado por Supabase
// ("amr": cómo y cuándo entraste), así que no se puede falsificar.
export async function signedInWithGoogleRecently(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  const amr = (data?.claims.amr ?? []) as { method?: string; timestamp?: number }[];
  const now = Math.floor(Date.now() / 1000);
  return amr.some((a) => a.method === "oauth" && now - (a.timestamp ?? 0) < GOOGLE_CONFIRM_MINUTES * 60);
}

// Perfil → Privacidad: tus dos decisiones (comunicaciones de HAPPA y cesión a colaboradores).
// Lo que nunca decidiste sale como "no" (así son los usuarios registrados antes de existir la opción).
export async function getMyPrivacyChoices(): Promise<MyPrivacyChoices> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_privacy_choices");
  if (error) throw error;
  const choices = Object.fromEntries(
    PRIVACY_PURPOSES.map((purpose) => [purpose, { granted: false, changedAt: null }]),
  ) as MyPrivacyChoices;
  for (const row of data ?? []) {
    if ((PRIVACY_PURPOSES as readonly string[]).includes(row.purpose)) {
      choices[row.purpose as PrivacyPurpose] = { granted: row.granted, changedAt: row.changed_at };
    }
  }
  return choices;
}
