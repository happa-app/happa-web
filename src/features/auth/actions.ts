"use server";
// Acciones de servidor: funciones que el formulario llama directamente al enviarse.
// Es el equivalente a tus handlers de "submit", pero se ejecutan en el servidor,
// así que las comprobaciones no se pueden saltar desde el navegador.
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { z } from "zod";
import { LEGAL_VERSIONS } from "@/features/legal/versions";
import { redirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { toAuthErrorKey } from "./errors";
import { loginSchema, signupSchema } from "./schemas";
import type { AuthFormState } from "./types";

const HOME_PATH = "/inicio";
const LOGIN_PATH = "/login";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formLocale(formData: FormData): Locale {
  const value = text(formData, "locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

// Dirección de la web (localhost en desarrollo, happa.es en producción).
// Supabase solo acepta enlaces de vuelta que estén en su lista de URLs permitidas.
async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = formLocale(formData);
  const values = { email: text(formData, "email").trim() };

  const parsed = loginSchema.safeParse({
    email: values.email,
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", formError: toAuthErrorKey(error), values };
  }

  return redirect({ href: HOME_PATH, locale });
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = formLocale(formData);
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
  const nextPath = locale === routing.defaultLocale ? HOME_PATH : `/${locale}${HOME_PATH}`;

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
  if (data.session) {
    redirect({ href: HOME_PATH, locale });
  }

  // Si el correo ya existía, Supabase responde igual a propósito (para no revelar
  // qué correos están registrados). Por eso siempre se muestra "revisa tu correo".
  return { status: "checkEmail" };
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: LOGIN_PATH, locale: formLocale(formData) });
}
