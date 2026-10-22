"use server";
// Mandar un mensaje de contacto. La función de la base de datos (migración 20) comprueba la sesión y el
// límite de mensajes por hora; aquí solo se valida el formulario.
import { headers } from "next/headers";
import { parseLocale } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { toContactErrorKey } from "./errors";
import { contactSchema } from "./schemas";
import type { ContactErrorKey, ContactFormState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function sendContactMessage(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const message = text(formData, "message");
  const parsed = contactSchema.safeParse({
    kind: text(formData, "kind"),
    message,
    householdId: text(formData, "householdId") || undefined,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    const error: ContactErrorKey = first === "messageRequired" || first === "messageTooLong" ? first : "generic";
    return { status: "error", error, message };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_contact_message", {
    p_kind: parsed.data.kind,
    p_message: parsed.data.message,
    p_household: parsed.data.householdId,
    p_locale: parseLocale(formData.get("locale")),
    // El móvil o navegador, para poder reproducir los errores
    p_user_agent: (await headers()).get("user-agent") ?? undefined,
  });
  if (error) return { status: "error", error: toContactErrorKey(error), message };

  return { status: "sent" };
}
