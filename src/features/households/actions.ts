"use server";
// Acciones de hogares. Todas llaman a funciones de la base de datos (migraciones 1 y 3),
// que son las que comprueban permisos: aquí solo se validan los datos del formulario.
import { z } from "zod";
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { toHouseholdErrorKey } from "./errors";
import { normalizeInviteCode } from "./invite-code";
import { createHouseholdSchema, householdIdSchema, inviteCodeSchema } from "./schemas";
import type { HouseholdFormState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createHousehold(
  _prevState: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const locale = parseLocale(formData.get("locale"));
  const values = { name: text(formData, "name"), kind: text(formData, "kind") };

  const parsed = createHouseholdSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data: householdId, error } = await supabase.rpc("create_household", {
    p_name: parsed.data.name,
    p_kind: parsed.data.kind,
  });
  if (error || !householdId) {
    return { status: "error", formError: error ? toHouseholdErrorKey(error) : "generic", values };
  }

  return redirect({ href: `/hogar/${householdId}`, locale });
}

// Sirve para el código escrito a mano y para el botón del enlace de invitación.
export async function joinHousehold(
  _prevState: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const locale = parseLocale(formData.get("locale"));
  const code = normalizeInviteCode(text(formData, "code"));
  const values = { code: text(formData, "code") };

  const parsed = inviteCodeSchema.safeParse(code);
  if (!parsed.success) {
    return { status: "error", fieldErrors: { code: ["codeInvalid"] }, values };
  }

  const supabase = await createClient();
  const { data: householdId, error } = await supabase.rpc("join_household", { p_code: parsed.data });
  if (error || !householdId) {
    return { status: "error", formError: error ? toHouseholdErrorKey(error) : "generic", values };
  }

  return redirect({ href: `/hogar/${householdId}`, locale });
}

export async function leaveHousehold(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const householdId = householdIdSchema.parse(text(formData, "householdId"));

  const supabase = await createClient();
  // Si eres el último admin, la base de datos pasa el rol al adulto más antiguo.
  const { error } = await supabase.rpc("leave_household", { p_household: householdId });
  if (error) {
    console.error("[households] no se pudo salir:", error);
    throw new Error("leave_household failed");
  }

  redirect({ href: "/inicio", locale });
}

export async function regenerateInviteCode(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const householdId = householdIdSchema.parse(text(formData, "householdId"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("regenerate_invite_code", { p_household: householdId });
  if (error) {
    console.error("[households] no se pudo cambiar el código:", error);
    throw new Error("regenerate_invite_code failed");
  }

  // Volver a la misma página la recarga con el código nuevo.
  redirect({ href: `/hogar/${householdId}`, locale });
}
