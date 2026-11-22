// Lecturas del corcho para las páginas (en el servidor). El RLS (migración 32) decide qué llega:
// los pagos solo a los adultos, y nada a quien no vive en el hogar.
import { createClient } from "@/lib/supabase/server";
import { wifiQrSvg } from "./qr";
import type { BoardNote, BoardPayment, BoardWifi } from "./types";

export type BoardOverview = {
  householdName: string;
  // Tú
  me: string;
  isAdult: boolean;
  isAdmin: boolean;
  wifi: BoardWifi | null;
  wifiQrSvg: string | null;
  // Vacío para los menores (no los pueden leer)
  payments: BoardPayment[];
  // Notas fijadas, de la más antigua a la más nueva
  rules: BoardNote[];
  // Notas sin fijar, la más nueva primero
  notes: BoardNote[];
  // Cuándo se leyó (para "hoy", "ayer"... de las notas)
  now: number;
};

type MemberRow = { user_id: string; role: string; profiles: { display_name: string } | null };

// Todo el corcho de un hogar. null si no vives en él (el casero y quien se fue tampoco lo ven).
export async function getBoard(householdId: string, userId: string): Promise<BoardOverview | null> {
  const supabase = await createClient();
  const [household, members, wifi, payments, notes] = await Promise.all([
    supabase.from("households").select("name").eq("id", householdId).maybeSingle(),
    supabase
      .from("household_members")
      .select("user_id, role, profiles(display_name)")
      .eq("household_id", householdId)
      .is("left_at", null)
      .in("role", ["admin", "member", "minor"]),
    supabase.from("household_wifi").select("ssid, password, security").eq("household_id", householdId).maybeSingle(),
    supabase
      .from("household_payments")
      .select("id, label, kind, value")
      .eq("household_id", householdId)
      .order("position"),
    supabase
      .from("board_notes")
      .select("id, body, pinned, author_id, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [household, members, wifi, payments, notes]) if (r.error) throw r.error;
  if (!household.data) return null;

  const memberRows = (members.data ?? []) as unknown as MemberRow[];
  const mine = memberRows.find((m) => m.user_id === userId);
  if (!mine) return null;
  const names = new Map(memberRows.map((m) => [m.user_id, m.profiles?.display_name ?? ""]));

  const allNotes: BoardNote[] = (notes.data ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    pinned: n.pinned,
    authorId: n.author_id,
    // Vacío si ya no vive aquí o borró su cuenta (la página pone "Alguien")
    authorName: n.author_id ? (names.get(n.author_id) ?? "") : "",
    createdAt: n.created_at,
  }));
  const wifiData = wifi.data ? { ssid: wifi.data.ssid, password: wifi.data.password, security: wifi.data.security } : null;

  return {
    householdName: household.data.name,
    me: userId,
    isAdult: mine.role === "admin" || mine.role === "member",
    isAdmin: mine.role === "admin",
    wifi: wifiData,
    wifiQrSvg: wifiData ? await wifiQrSvg(wifiData) : null,
    payments: (payments.data ?? []).map((p) => ({ id: p.id, label: p.label, kind: p.kind, value: p.value })),
    rules: allNotes.filter((n) => n.pinned).reverse(),
    notes: allNotes.filter((n) => !n.pinned),
    now: Date.now(),
  };
}
