"use server";
// Acciones de servidor: funciones que el formulario llama directamente al enviarse.
// Es el equivalente a tus handlers de "submit", pero se ejecutan en el servidor,
// así que las comprobaciones no se pueden saltar desde el navegador.
import { cookies } from "next/headers";
import { redirect as redirectToPath } from "next/navigation";
import { z } from "zod";
import { LEGAL_VERSIONS } from "@/features/legal/versions";
import { localizePath, parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { siteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/utils/safe-path";
import { toAuthErrorKey } from "./errors";
import { loginSchema, signupSchema } from "./schemas";
import type { AuthFormState } from "./types";

const HOME_PATH = "/inicio";
// La cookie donde next-intl recuerda el idioma (su nombre por defecto)
const LOCALE_COOKIE = "NEXT_LOCALE";
const LOGIN_PATH = "/login";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = parseLocale(formData.get("locale"));
  const next = safeNextPath(text(formData, "next"));
  const values = { email: text(formData, "email").trim() };

  const parsed = loginSchema.safeParse({
    email: values.email,
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", formError: toAuthErrorKey(error), values };
  }

  // Si venía de un enlace (por ejemplo, una invitación), vuelve ahí.
  if (next) redirectToPath(next);
  // Si no, a la app en el idioma de tu perfil (aunque entres desde otro móvil). También se guarda en la
  // cookie de idioma: si no, al ir a /inicio (español, sin /en) se cambiaría al idioma del navegador.
  const { data: profile } = await supabase.from("profiles").select("locale").eq("id", data.user.id).maybeSingle();
  const home = profile ? parseLocale(profile.locale) : locale;
  (await cookies()).set(LOCALE_COOKIE, home, { path: "/", sameSite: "lax" });
  return redirect({ href: HOME_PATH, locale: home });
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = parseLocale(formData.get("locale"));
  const nextPath = safeNextPath(text(formData, "next")) ?? localizePath(HOME_PATH, locale);
  const values = {
    email: text(formData, "email").trim(),
    displayName: text(formData, "displayName"),
  };

  const parsed = signupSchema.safeParse({
    displayName: values.displayName,
    email: values.email,
    password: text(formData, "password"),
    acceptLegal: formData.get("acceptLegal") === "on",
    isAdult: formData.get("isAdult") === "on",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { displayName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
      // La migración 4 lee estos datos al crear el perfil y guarda el consentimiento legal.
      data: { display_name: displayName, locale, legal: LEGAL_VERSIONS },
    },
  });
  if (error) {
    return { status: "error", formError: toAuthErrorKey(error), values };
  }

  // Si la confirmación por correo está desactivada, la sesión llega ya iniciada.
  if (data.session) redirectToPath(nextPath);

  // Si el correo ya existía, Supabase responde igual a propósito (para no revelar
  // qué correos están registrados). Por eso siempre se muestra "revisa tu correo".
  return { status: "checkEmail" };
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: LOGIN_PATH, locale: parseLocale(formData.get("locale")) });
}
