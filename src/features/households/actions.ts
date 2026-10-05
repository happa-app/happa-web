"use server";
// Acciones de hogares. Todas llaman a funciones de la base de datos (migraciones 1, 3 y 15),
// que son las que comprueban permisos: aquí solo se validan los datos del formulario.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { NAV_HOUSEHOLD_COOKIE } from "@/features/navigation/household-path";
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { toHouseholdErrorKey } from "./errors";
import { normalizeInviteCode } from "./invite-code";
import { createHouseholdSchema, householdIdSchema, inviteCodeSchema, placesSchema } from "./schemas";
import type { HouseholdFormState, PlacesFormState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createHousehold(
  _prevState: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const locale = parseLocale(formData.get("locale"));
  const values = { name: text(formData, "name"), kind: text(formData, "kind"), places: text(formData, "places") };

  const parsed = createHouseholdSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data: householdId, error } = await supabase.rpc("create_household", {
    p_name: parsed.data.name,
    p_kind: parsed.data.kind,
    p_max_members: parsed.data.places,
  });
  if (error || !householdId) {
    const key = error ? toHouseholdErrorKey(error) : "generic";
    if (key === "placesInvalid") return { status: "error", fieldErrors: { places: [key] }, values };
    return { status: "error", formError: key, values };
  }

  // La barra de abajo tiene que conocer el hogar nuevo
  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  // La barra de abajo deja de apuntar a este hogar
  const cookieStore = await cookies();
  if (cookieStore.get(NAV_HOUSEHOLD_COOKIE)?.value === householdId) cookieStore.delete(NAV_HOUSEHOLD_COOKIE);
  revalidatePath("/", "layout");

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
  redirect({ href: `/hogar/${householdId}/configuracion`, locale });
}

// Cambiar cuántas personas caben (solo el admin; la base de datos lo comprueba)
export async function saveHouseholdPlaces(_prev: PlacesFormState, formData: FormData): Promise<PlacesFormState> {
  const householdId = householdIdSchema.safeParse(text(formData, "householdId"));
  const places = placesSchema.safeParse(text(formData, "places"));
  if (!householdId.success) return { status: "error", error: "generic" };
  if (!places.success) return { status: "error", error: "placesInvalid" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_household_max_members", {
    p_household: householdId.data,
    p_max_members: places.data,
  });
  if (error) return { status: "error", error: toHouseholdErrorKey(error) };

  revalidatePath("/", "layout");
  return { status: "done" };
}
