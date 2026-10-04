// Lecturas de avisos para las páginas (en el servidor). RLS ya filtra: cada uno ve solo los suyos.
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_CATEGORIES, type AppNotification, type NotificationData, type NotificationPreferences, type NotificationType } from "./types";

type NotificationRow = {
  id: string;
  type: NotificationType;
  household_id: string | null;
  data: NotificationData;
  url: string;
  read_at: string | null;
  created_at: string;
};

// Los últimos avisos de la campana (los del chat no salen aquí)
export async function getNotifications(limit = 60): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, household_id, data, url, read_at, created_at")
    .eq("in_app", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as NotificationRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    householdId: row.household_id,
    data: row.data ?? {},
    url: row.url,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

// Qué llega al móvil (sin elegir = sí)
export async function getPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notification_preferences").select("category, push");
  if (error) throw error;
  const preferences = Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, true])) as NotificationPreferences;
  for (const row of (data ?? []) as { category: keyof NotificationPreferences; push: boolean }[]) {
    preferences[row.category] = row.push;
  }
  return preferences;
}

// Una ruta de un aviso tuyo (para abrirlo). null si no existe o no es tuyo.
export async function getNotificationUrl(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("url").eq("id", id).maybeSingle();
  return (data as { url: string } | null)?.url ?? null;
}

// La hora de ahora (para "hace 5 minutos"); fuera del componente para que React no lo vea como impuro
export function serverNow(): number {
  return Date.now();
}
