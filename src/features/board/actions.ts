"use server";
// Acciones del corcho. Llaman a funciones de la base de datos (migración 32), que son las que comprueban
// permisos (quién cambia el WiFi y los pagos, quién fija o quita una nota): aquí solo se validan los datos.
import { revalidatePath } from "next/cache";
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { toBoardErrorKey } from "./errors";
import {
  buildNote,
  buildPayment,
  buildWifi,
  uuidSchema,
  type BoardActionState,
  type BoardFormState,
} from "./schemas";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function id(formData: FormData, key: string): string | null {
  const parsed = uuidSchema.safeParse(text(formData, key));
  return parsed.success ? parsed.data : null;
}

// Poner o cambiar el WiFi
export async function saveWifi(_prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  if (!householdId) return { status: "error", formError: "generic" };
  const built = buildWifi({
    ssid: text(formData, "ssid"),
    password: text(formData, "password"),
    security: text(formData, "security"),
  });
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_household_wifi", {
    p_household: householdId,
    p_ssid: built.value.ssid,
    p_password: built.value.password,
    p_security: built.value.security,
  });
  if (error) {
    const key = toBoardErrorKey(error);
    if (key === "ssidRequired") return { status: "error", fieldErrors: { ssid: key } };
    if (key === "passwordInvalid") return { status: "error", fieldErrors: { password: key } };
    return { status: "error", formError: key };
  }
  return redirect({ href: `/hogar/${householdId}/corcho`, locale });
}

// Quitar el WiFi
export async function removeWifi(_prev: BoardActionState, formData: FormData): Promise<BoardActionState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  if (!householdId) return { status: "error", error: "generic" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_household_wifi", { p_household: householdId });
  if (error) return { status: "error", error: toBoardErrorKey(error) };
  return redirect({ href: `/hogar/${householdId}/corcho`, locale });
}

// Añadir un dato de pago
export async function addPayment(_prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  if (!householdId) return { status: "error", formError: "generic" };
  const built = buildPayment({
    label: text(formData, "label"),
    kind: text(formData, "kind"),
    value: text(formData, "value"),
  });
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_household_payment", {
    p_household: householdId,
    p_label: built.value.label,
    p_kind: built.value.kind,
    p_value: built.value.value,
  });
  if (error) {
    const key = toBoardErrorKey(error);
    if (key === "labelRequired") return { status: "error", fieldErrors: { label: key } };
    if (key === "ibanInvalid" || key === "bizumInvalid") return { status: "error", fieldErrors: { value: key } };
    return { status: "error", formError: key };
  }
  return redirect({ href: `/hogar/${householdId}/corcho`, locale });
}

// Lo que se hace desde la página del corcho: clavar, fijar o quitar una nota, y quitar un pago
export async function boardAction(_prev: BoardActionState, formData: FormData): Promise<BoardActionState> {
  const householdId = id(formData, "householdId");
  const intent = text(formData, "intent");
  if (!householdId) return { status: "error", error: "generic" };
  const supabase = await createClient();
  let result: { error: { message?: string; code?: string } | null };

  if (intent === "addNote") {
    const built = buildNote({ body: text(formData, "body"), pinned: text(formData, "pinned") === "on" });
    if (!built.ok) return { status: "error", error: built.fieldErrors.body ?? built.formError ?? "generic" };
    result = await supabase.rpc("add_board_note", {
      p_household: householdId,
      p_body: built.value.body,
      p_pinned: built.value.pinned,
    });
  } else if (intent === "deletePayment") {
    const paymentId = id(formData, "paymentId");
    if (!paymentId) return { status: "error", error: "generic" };
    result = await supabase.rpc("delete_household_payment", { p_payment: paymentId });
  } else if (intent === "pin" || intent === "unpin" || intent === "deleteNote") {
    const noteId = id(formData, "noteId");
    if (!noteId) return { status: "error", error: "generic" };
    result =
      intent === "deleteNote"
        ? await supabase.rpc("delete_board_note", { p_note: noteId })
        : await supabase.rpc("set_board_note_pinned", { p_note: noteId, p_pinned: intent === "pin" });
  } else {
    return { status: "error", error: "generic" };
  }
  if (result.error) return { status: "error", error: toBoardErrorKey(result.error) };

  // Se vuelve a pintar la página en la que estás, sin moverte de sitio
  revalidatePath("/", "layout");
  return { status: "done" };
}
