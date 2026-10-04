// Acceso a los mensajes del chat. Recibe el cliente de Supabase como parámetro, así sirve igual en el
// servidor (primera carga) y en el navegador (en vivo). Los permisos los aplica la base de datos (migración 13).
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { normalizeTimestamp } from "./timeline";
import { PAGE_SIZE, type ChatMessage, type MessageVersion } from "./types";

const MESSAGE_FIELDS = "id, sender_id, body, created_at, edited_at";

export type MessageRow = {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
};

export function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: normalizeTimestamp(row.created_at),
    editedAt: row.edited_at ? normalizeTimestamp(row.edited_at) : null,
  };
}

// Una página de mensajes, de más antiguo a más nuevo. before: solo los anteriores a esa fecha.
export async function fetchMessages(
  supabase: AppSupabaseClient,
  conversationId: string,
  before?: string,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  let query = supabase.from("messages").select(MESSAGE_FIELDS).eq("conversation_id", conversationId);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (error) throw error;
  const rows = (data ?? []) as MessageRow[];
  return { messages: rows.slice(0, PAGE_SIZE).reverse().map(toMessage), hasMore: rows.length > PAGE_SIZE };
}

// Los mensajes posteriores a una fecha (para ponerse al día al volver a la app)
export async function fetchNewer(supabase: AppSupabaseClient, conversationId: string, after: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .eq("conversation_id", conversationId)
    .gt("created_at", after)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map(toMessage);
}

export async function sendMessage(supabase: AppSupabaseClient, conversationId: string, body: string): Promise<ChatMessage> {
  const { data, error } = await supabase.rpc("send_message", { p_conversation: conversationId, p_body: body });
  if (error) throw error;
  return toMessage(data as unknown as MessageRow);
}

export async function editMessage(supabase: AppSupabaseClient, messageId: string, body: string): Promise<ChatMessage> {
  const { data, error } = await supabase.rpc("edit_message", { p_message: messageId, p_body: body });
  if (error) throw error;
  return toMessage(data as unknown as MessageRow);
}

export async function hideMessage(supabase: AppSupabaseClient, messageId: string) {
  const { error } = await supabase.rpc("hide_message", { p_message: messageId });
  if (error) throw error;
}

export async function unhideMessage(supabase: AppSupabaseClient, messageId: string) {
  const { error } = await supabase.rpc("unhide_message", { p_message: messageId });
  if (error) throw error;
}

export async function markRead(supabase: AppSupabaseClient, conversationId: string) {
  const { error } = await supabase.rpc("mark_chat_read", { p_conversation: conversationId });
  if (error) throw error;
}

// Lo que ponía un mensaje antes de cada cambio, del más antiguo al más reciente
export async function fetchVersions(supabase: AppSupabaseClient, messageId: string): Promise<MessageVersion[]> {
  const { data, error } = await supabase
    .from("message_edits")
    .select("body, written_at, replaced_at")
    .eq("message_id", messageId)
    .order("replaced_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { body: string; written_at: string; replaced_at: string }[]).map((v) => ({
    body: v.body,
    writtenAt: normalizeTimestamp(v.written_at),
    replacedAt: normalizeTimestamp(v.replaced_at),
  }));
}
