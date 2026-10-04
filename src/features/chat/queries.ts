// Lecturas del chat para las páginas (se ejecutan en el servidor).
// Los permisos los pone la base de datos (migración 13): solo quien está en el chat lo ve.
import { createClient } from "@/lib/supabase/server";
import { fetchMessages } from "./api";
import { dayIn } from "./timeline";
import type { ChatInfo, ChatMessage, ChatPerson, ChatSummary } from "./types";

export type ChatPage = {
  info: ChatInfo;
  people: ChatPerson[];
  messages: ChatMessage[];
  hasMore: boolean;
  // Hoy en la zona horaria del hogar
  today: string;
};

// Todo lo necesario para abrir el chat de un hogar. null si no estás en él.
export async function getChatPage(householdId: string): Promise<ChatPage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_chat", { p_household: householdId });
  if (error) {
    if (error.message?.includes("Not allowed")) return null;
    throw error;
  }
  const row = ((data ?? []) as { conversation_id: string; household_name: string; timezone: string; is_resident: boolean }[])[0];
  if (!row) return null;

  const [people, page] = await Promise.all([
    supabase.rpc("chat_people", { p_conversation: row.conversation_id }),
    fetchMessages(supabase, row.conversation_id),
  ]);
  if (people.error) throw people.error;

  return {
    info: {
      conversationId: row.conversation_id,
      householdName: row.household_name,
      timezone: row.timezone,
      isResident: row.is_resident,
    },
    people: ((people.data ?? []) as { user_id: string; display_name: string; is_member: boolean }[]).map((p) => ({
      userId: p.user_id,
      name: p.display_name,
      isMember: p.is_member,
    })),
    messages: page.messages,
    hasMore: page.hasMore,
    today: dayIn(new Date().toISOString(), row.timezone),
  };
}

// Para la tarjeta del hogar: sin leer, el último mensaje y quién lo mandó. null si no estás en el chat.
export async function getChatSummary(householdId: string): Promise<{ summary: ChatSummary; lastSenderName: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("chat_summary", { p_household: householdId });
  if (error) throw error;
  const row = ((data ?? []) as {
    unread: number;
    last_body: string | null;
    last_sender: string | null;
    last_at: string | null;
  }[])[0];
  if (!row) return null;

  let lastSenderName: string | null = null;
  if (row.last_sender) {
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", row.last_sender).maybeSingle();
    lastSenderName = profile?.display_name ?? null;
  }
  return {
    summary: { unread: row.unread, lastBody: row.last_body, lastSenderId: row.last_sender, lastAt: row.last_at },
    lastSenderName,
  };
}
