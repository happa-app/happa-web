// Acceso a los mensajes del chat. Recibe el cliente de Supabase como parámetro, así sirve igual en el
// servidor (primera carga) y en el navegador (en vivo). Los permisos los aplica la base de datos
// (migraciones 13 y 21).
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { normalizeTimestamp } from "./timeline";
import { PAGE_SIZE, type ChatMessage, type ChatPoll, type MessageVersion } from "./types";

const MESSAGE_FIELDS = "id, sender_id, body, created_at, edited_at, kind";

export type MessageRow = {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  kind: string;
};

export function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: normalizeTimestamp(row.created_at),
    editedAt: row.edited_at ? normalizeTimestamp(row.edited_at) : null,
    kind: row.kind === "poll" ? "poll" : "text",
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

// ───────────── Votaciones (migración 21) ─────────────

type PollRow = {
  message_id: string;
  question: string;
  multiple: boolean;
  minors_can_vote: boolean;
  poll_options: { id: string; position: number; label: string }[];
  poll_votes: { option_id: string; user_id: string; created_at: string }[];
};

function toPoll(row: PollRow): ChatPoll {
  const votes = [...row.poll_votes].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    messageId: row.message_id,
    question: row.question,
    multiple: row.multiple,
    minorsCanVote: row.minors_can_vote,
    options: [...row.poll_options]
      .sort((a, b) => a.position - b.position)
      .map((o) => ({
        id: o.id,
        label: o.label,
        voters: votes.filter((v) => v.option_id === o.id).map((v) => v.user_id),
      })),
  };
}

// Las votaciones de esos mensajes, con sus opciones y sus votos
export async function fetchPolls(supabase: AppSupabaseClient, messageIds: string[]): Promise<ChatPoll[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await supabase
    .from("polls")
    .select("message_id, question, multiple, minors_can_vote, poll_options(id, position, label), poll_votes(option_id, user_id, created_at)")
    .in("message_id", messageIds);
  if (error) throw error;
  return ((data ?? []) as PollRow[]).map(toPoll);
}

export async function createPoll(
  supabase: AppSupabaseClient,
  conversationId: string,
  poll: { question: string; options: string[]; multiple: boolean; minorsCanVote: boolean },
): Promise<ChatMessage> {
  const { data, error } = await supabase.rpc("create_poll", {
    p_conversation: conversationId,
    p_question: poll.question,
    p_options: poll.options,
    p_multiple: poll.multiple,
    p_minors_can_vote: poll.minorsCanVote,
  });
  if (error) throw error;
  return toMessage(data as unknown as MessageRow);
}

// optionIds sustituye a tu voto anterior (vacío = quitar el voto)
export async function votePoll(supabase: AppSupabaseClient, pollId: string, optionIds: string[]) {
  const { error } = await supabase.rpc("vote_poll", { p_poll: pollId, p_options: optionIds });
  if (error) throw error;
}
