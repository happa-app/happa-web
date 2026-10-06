"use server";
// Acciones del perfil (se ejecutan en el servidor, con tu sesión): nombre, foto, idioma, correo,
// contraseña y borrar la cuenta. Quién puede qué lo decide además la base de datos (migración 18).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { localizePath, parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { siteOrigin } from "@/lib/site-origin";
import { dropFresh, signInFresh } from "@/lib/supabase/fresh";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_BUCKET, isAvatarPathOf } from "./avatar";
import { displayNameSchema, emailSchema, newPasswordSchema } from "./schemas";
import { PROFILE_ERROR_KEYS, type ProfileErrorKey, type ProfileFormState } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fail(error: ProfileErrorKey, field?: string): ProfileFormState {
  return { status: "error", error, field };
}

// La clave de error de zod (si es una de las nuestras)
function zodKey(error: z.ZodError): ProfileErrorKey {
  const key = error.issues[0]?.message;
  return (PROFILE_ERROR_KEYS as readonly string[]).includes(key) ? (key as ProfileErrorKey) : "generic";
}

// Errores de Supabase Auth → nuestras claves (nunca se enseña el texto de Supabase)
function authKey(error: { code?: string; status?: number }): ProfileErrorKey {
  switch (error.code) {
    case "invalid_credentials":
      return "wrongPassword";
    case "same_password":
      return "samePassword";
    case "weak_password":
      return "passwordWeak";
    case "email_exists":
    case "user_already_exists":
      return "emailTaken";
    case "email_address_invalid":
      return "emailInvalid";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      console.error("[perfil] error de Supabase Auth sin traducir:", error);
      return error.status === 429 ? "rateLimited" : "generic";
  }
}

async function me(supabase: Supabase): Promise<{ userId: string } | null> {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  return userId ? { userId } : null;
}

// Tu correo de verdad, preguntado a Supabase (el de la sesión puede ser el viejo si lo acabas de cambiar)
async function myEmail(supabase: Supabase): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error("[perfil] no se pudo leer la cuenta:", error);
  return data.user?.email ?? null;
}

// Borra los archivos de tu carpeta de fotos menos el que se diga (también los que se quedaron a medias)
async function removeAvatarFiles(supabase: Supabase, userId: string, keep?: string): Promise<boolean> {
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { data, error } = await bucket.list(userId, { limit: 100 });
  if (error) {
    console.error("[perfil] no se pudo ver la carpeta de fotos:", error);
    return false;
  }
  const paths = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (paths.length === 0) return true;
  const { error: removeError } = await bucket.remove(paths);
  if (removeError) {
    console.error("[perfil] no se pudieron borrar fotos viejas:", removeError);
    return false;
  }
  return true;
}

// ───────────── Nombre ─────────────
export async function updateDisplayName(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = displayNameSchema.safeParse(text(formData, "name"));
  if (!parsed.success) return fail(zodKey(parsed.error), "name");

  const supabase = await createClient();
  const user = await me(supabase);
  if (!user) return fail("generic");

  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", user.userId);
  if (error) {
    console.error("[perfil] no se pudo cambiar el nombre:", error);
    return fail("generic");
  }
  // El nombre sale en la cabecera y en todas partes
  revalidatePath("/", "layout");
  return { status: "done" };
}

// ───────────── Foto ─────────────
// La foto ya está subida (desde el navegador) en tu carpeta: se pone en el perfil y se borran las viejas
export async function saveAvatar(path: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await me(supabase);
  if (!user || typeof path !== "string" || !isAvatarPathOf(path, user.userId)) return { ok: false };

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.userId);
  if (error) {
    console.error("[perfil] no se pudo guardar la foto:", error);
    return { ok: false };
  }
  // Si fallan las viejas no pasa nada grave: se borrarán con la próxima foto
  await removeAvatarFiles(supabase, user.userId, path);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await me(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.userId);
  if (error) {
    console.error("[perfil] no se pudo quitar la foto:", error);
    return { ok: false };
  }
  await removeAvatarFiles(supabase, user.userId);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────────── Idioma ─────────────
// Se guarda en el perfil (para los avisos al móvil y al entrar desde otro sitio). Cambiar el idioma de
// la página lo hace el navegador después.
export async function saveLanguage(value: string): Promise<{ ok: boolean }> {
  const locale = parseLocale(value);
  if (locale !== value) return { ok: false };
  const supabase = await createClient();
  const user = await me(supabase);
  if (!user) return { ok: false };
  const { error } = await supabase.from("profiles").update({ locale }).eq("id", user.userId);
  if (error) {
    console.error("[perfil] no se pudo guardar el idioma:", error);
    return { ok: false };
  }
  return { ok: true };
}

// ───────────── Correo ─────────────
// Supabase manda un enlace al correo nuevo (y, si está activado "Secure email change", otro al actual).
// El cambio se hace al abrirlos.
export async function changeEmail(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const locale = parseLocale(formData.get("locale"));
  const parsed = emailSchema.safeParse(text(formData, "email").trim());
  if (!parsed.success) return fail("emailInvalid", "email");

  const supabase = await createClient();
  const email = await myEmail(supabase);
  if (!email) return fail("generic");
  if (email.toLowerCase() === parsed.data.toLowerCase()) return fail("sameEmail", "email");

  // Al abrir los enlaces se vuelve a Tu cuenta, que pregunta a Supabase cómo ha quedado el cambio
  // (con "Secure email change" hay que abrir dos: uno en cada correo, quizá en móviles distintos)
  const next = localizePath("/perfil/cuenta?correo=1", locale);
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${await siteOrigin()}/auth/confirm?flow=email&next=${encodeURIComponent(next)}` },
  );
  if (error) {
    const key = authKey(error);
    return fail(key, key === "emailTaken" || key === "emailInvalid" ? "email" : undefined);
  }
  return { status: "done", email: parsed.data };
}

// ───────────── Contraseña ─────────────
// Pide la actual (por si alguien coge tu móvil con la sesión abierta) y cierra la sesión en tus otros
// dispositivos. La actual se comprueba con una sesión aparte: la de este navegador no cambia.
export async function changePassword(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const current = text(formData, "current");
  const next = text(formData, "next");
  if (!current) return fail("passwordRequired", "current");
  const parsed = newPasswordSchema.safeParse(next);
  if (!parsed.success) return fail(zodKey(parsed.error), "next");
  if (text(formData, "repeat") !== next) return fail("passwordMismatch", "repeat");
  if (next === current) return fail("samePassword", "next");

  const supabase = await createClient();
  const email = await myEmail(supabase);
  if (!email) return fail("generic");

  const fresh = await signInFresh(email, current);
  if (fresh.error) {
    const key = authKey(fresh.error);
    return fail(key, key === "wrongPassword" ? "current" : undefined);
  }
  const { error } = await fresh.client.auth.updateUser({ password: next });
  if (error) {
    await dropFresh(fresh.client);
    const key = authKey(error);
    return fail(key, key === "samePassword" || key === "passwordWeak" ? "next" : undefined);
  }
  // Fuera las demás sesiones (también la de la comprobación); la de este navegador sigue
  const { error: othersError } = await supabase.auth.signOut({ scope: "others" });
  if (othersError) {
    console.error("[perfil] no se pudo cerrar la sesión en otros dispositivos:", othersError);
    await dropFresh(fresh.client);
  }
  return { status: "done" };
}

// ───────────── Borrar la cuenta ─────────────
export async function deleteAccount(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const locale = parseLocale(formData.get("locale"));
  const password = text(formData, "password");
  if (!password) return fail("passwordRequired", "password");
  if (formData.get("confirm") !== "on") return fail("confirmRequired", "confirm");

  const supabase = await createClient();
  const user = await me(supabase);
  const email = await myEmail(supabase);
  if (!user || !email) return fail("generic");

  // 1. Que seas tú: con una sesión aparte, recién abierta con tu contraseña (la base de datos lo exige)
  const fresh = await signInFresh(email, password);
  if (fresh.error) {
    const key = authKey(fresh.error);
    return fail(key, key === "wrongPassword" ? "password" : undefined);
  }
  const stop = async (key: ProfileErrorKey): Promise<ProfileFormState> => {
    await dropFresh(fresh.client);
    return fail(key);
  };

  // 2. Que no debas dinero ni tengas nada a medias (antes de tocar la foto; la base de datos lo vuelve
  //    a mirar al borrar). Primero se apuntan los gastos fijos que ya tocaban, como en la página.
  const { data: memberships } = await fresh.client
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.userId)
    .is("left_at", null)
    .in("role", ["admin", "member"]);
  for (const m of memberships ?? []) {
    const { error: syncError } = await fresh.client.rpc("sync_recurring_expenses", { p_household: m.household_id });
    if (syncError) console.error("[perfil] no se pudieron poner al día los gastos fijos:", syncError);
  }
  const { data: balances, error: balancesError } = await fresh.client.rpc("my_pending_balances");
  if (balancesError) {
    console.error("[perfil] no se pudieron leer los saldos:", balancesError);
    return stop("generic");
  }
  if ((balances ?? []).some((b) => Number(b.net_cents) < 0)) return stop("owesMoney");
  if ((balances ?? []).some((b) => Number(b.pending) > 0)) return stop("pendingMoney");

  // 3. Tu foto (desde SQL no se puede borrar: se hace aquí, antes)
  const { error: photoError } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.userId);
  if (photoError || !(await removeAvatarFiles(supabase, user.userId))) {
    if (photoError) console.error("[perfil] no se pudo quitar la foto antes de borrar:", photoError);
    return stop("generic");
  }

  // 4. La cuenta
  const { error } = await fresh.client.rpc("delete_my_account");
  if (error) {
    const message = error.message ?? "";
    if (message.includes("You owe money")) return stop("owesMoney");
    if (message.includes("Pending money")) return stop("pendingMoney");
    if (message.includes("Minor accounts")) return stop("minor");
    console.error("[perfil] no se pudo borrar la cuenta:", error);
    return stop("generic");
  }

  // 5. Fuera la sesión de este navegador (la cuenta ya no existe)
  await supabase.auth.signOut({ scope: "local" });
  return redirect({ href: { pathname: "/login", query: { cuenta: "borrada" } }, locale });
}
