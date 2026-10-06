// Lecturas del chat para las páginas (se ejecutan en el servidor).
// Los permisos los pone la base de datos (migración 13): solo quien está en el chat lo ve.
import { avatarUrl } from "@/features/profile/avatar";
import { createClient } from "@/lib/supabase/server";
import { fetchMessages } from "./api";
import { dayIn } from "./timeline";
import type { ChatInfo, ChatMessage, ChatPerson } from "./types";

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
    people: ((people.data ?? []) as { user_id: string; display_name: string; is_member: boolean; avatar_path: string | null }[]).map(
      (p) => ({
        userId: p.user_id,
        name: p.display_name,
        isMember: p.is_member,
        avatarUrl: avatarUrl(p.avatar_path),
      }),
    ),
    messages: page.messages,
    hasMore: page.hasMore,
    today: dayIn(new Date().toISOString(), row.timezone),
  };
}
