"use server";
// Acciones de avisos: abrir uno (queda leído y te lleva a donde toca), marcar todos como leídos y
// elegir qué llega al móvil.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotificationUrl } from "./queries";
import { NOTIFICATION_CATEGORIES, type NotificationsActionState } from "./types";

const uuid = z.uuid();

// Abrir un aviso: queda leído y vas a su pantalla
export async function openNotification(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const parsed = uuid.safeParse(formData.get("id"));
  if (!parsed.success) return redirect({ href: "/avisos", locale });

  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read", { p_ids: [parsed.data] });
  const url = await getNotificationUrl(parsed.data);
  // Solo rutas de la app (las pone la base de datos; aun así se comprueba)
  const href = url && /^\/[a-z0-9/_-]*$/.test(url) ? url : "/avisos";
  return redirect({ href, locale });
}

export async function markAllNotificationsRead(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read", {});
  revalidatePath("/", "layout");
  return redirect({ href: "/avisos", locale });
}

// Qué tipos de avisos llegan al móvil
export async function savePreferences(_prev: NotificationsActionState, formData: FormData): Promise<NotificationsActionState> {
  const supabase = await createClient();
  const results = await Promise.all(
    NOTIFICATION_CATEGORIES.map((category) =>
      supabase.rpc("set_notification_preference", { p_category: category, p_push: formData.get(category) === "on" }),
    ),
  );
  if (results.some((r) => r.error)) {
    console.error("[avisos] no se pudieron guardar las preferencias:", results.find((r) => r.error)?.error);
    return { status: "error" };
  }
  return { status: "done" };
}
