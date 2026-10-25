"use server";
// Acciones de servidor: funciones que el formulario llama directamente al enviarse.
// Es el equivalente a tus handlers de "submit", pero se ejecutan en el servidor,
// así que las comprobaciones no se pueden saltar desde el navegador.
import { cookies } from "next/headers";
import { redirect as redirectToPath } from "next/navigation";
import { z } from "zod";
import { LEGAL_VERSIONS, PRIVACY_CHOICES_VERSION } from "@/features/legal/versions";
import { localizePath, parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { captchaToken } from "@/lib/captcha";
import { siteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/utils/safe-path";
import { toAuthErrorKey } from "./errors";
import { clearRecoveryCookie, hasRecoverySession, NEW_PASSWORD_PATH } from "./recovery";
import { completeSignupSchema, forgotPasswordSchema, loginSchema, newPasswordSchema, signupSchema } from "./schemas";
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
  const { data, error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken: captchaToken(formData) },
  });
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
      captchaToken: captchaToken(formData),
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
      // Las migraciones 4 y 19 leen estos datos al crear el perfil: guardan los términos y la privacidad
      // aceptados y las dos decisiones opcionales (marcadas o no), con la versión de su texto.
      data: {
        display_name: displayName,
        locale,
        legal: LEGAL_VERSIONS,
        choices: {
          marketing: formData.get("marketing") === "on",
          partners: formData.get("partners") === "on",
          version: PRIVACY_CHOICES_VERSION,
        },
      },
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

// Pide el correo para recuperar la contraseña. Su enlace pasa por /auth/confirm, que inicia la sesión y
// lleva a /nueva-contrasena.
export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = parseLocale(formData.get("locale"));
  const values = { email: text(formData, "email").trim() };

  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const nextPath = localizePath(NEW_PASSWORD_PATH, locale);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    captchaToken: captchaToken(formData),
    // "flow=recovery": así /auth/confirm sabe que es este enlace, venga en el formato que venga
    redirectTo: `${await siteOrigin()}/auth/confirm?flow=recovery&next=${encodeURIComponent(nextPath)}`,
  });
  if (error) {
    return { status: "error", formError: toAuthErrorKey(error), values };
  }

  // Si el correo no tiene cuenta, Supabase responde igual a propósito: así nadie puede averiguar quién
  // está registrado. Por eso siempre se muestra "si hay una cuenta, te hemos enviado un enlace".
  return { status: "checkEmail", values };
}

// Guarda la contraseña nueva. Solo vale con la sesión que abre el enlace del correo (ver recovery.ts):
// con la sesión de siempre, la contraseña se cambia en Perfil → Tu cuenta, que pide la actual.
export async function setNewPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = parseLocale(formData.get("locale"));

  const supabase = await createClient();
  if (!(await hasRecoverySession(supabase))) {
    return { status: "error", formError: "linkExpired" };
  }

  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    repeat: text(formData, "repeat"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const key = toAuthErrorKey(error);
    if (key === "samePassword" || key === "passwordWeak") {
      return { status: "error", fieldErrors: { password: [key] } };
    }
    return { status: "error", formError: key };
  }

  // Cierra la sesión en los demás dispositivos: si alguien había entrado en tu cuenta, se queda fuera.
  await supabase.auth.signOut({ scope: "others" });
  await clearRecoveryCookie();
  return redirect({ href: HOME_PATH, locale });
}

// Entrar (o registrarse) con Google. Supabase devuelve la dirección de Google y se va allí; al volver, Google
// pasa por /auth/confirm, que inicia la sesión y, si es la primera vez, lleva a /bienvenida.
export async function signInWithGoogle(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const next = safeNextPath(text(formData, "next")) ?? localizePath(HOME_PATH, locale);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
      // Que Google pregunte siempre con qué cuenta (por si en el móvil hay varias)
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.error("[auth] no se pudo empezar a entrar con Google:", error);
    redirectToPath(`${localizePath(LOGIN_PATH, locale)}?error=google`);
  }
  redirectToPath(data.url);
}

// "Antes de empezar": lo del registro que Google no nos da. Guarda lo mismo que el registro normal.
export async function completeSignup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = parseLocale(formData.get("locale"));
  const next = safeNextPath(text(formData, "next"));
  const values = { displayName: text(formData, "displayName") };

  const parsed = completeSignupSchema.safeParse({
    displayName: values.displayName,
    acceptLegal: formData.get("acceptLegal") === "on",
    isAdult: formData.get("isAdult") === "on",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_signup", {
    p_display_name: parsed.data.displayName,
    p_locale: locale,
    p_terms: LEGAL_VERSIONS.terms,
    p_privacy: LEGAL_VERSIONS.privacy,
    p_is_adult: parsed.data.isAdult,
    p_marketing: formData.get("marketing") === "on",
    p_partners: formData.get("partners") === "on",
    p_choices: PRIVACY_CHOICES_VERSION,
  });
  if (error) {
    console.error("[auth] no se pudo terminar el registro:", error);
    return { status: "error", formError: "generic", values };
  }

  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax" });
  if (next) redirectToPath(next);
  return redirect({ href: HOME_PATH, locale });
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: LOGIN_PATH, locale: parseLocale(formData.get("locale")) });
}
