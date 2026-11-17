// Lecturas del chat para las páginas (se ejecutan en el servidor).
// Los permisos los pone la base de datos (migración 13): solo quien está en el chat lo ve.
import { suggestTransfers } from "@/features/expenses/settle";
import { avatarUrl } from "@/features/profile/avatar";
import { createClient } from "@/lib/supabase/server";
import { fetchMessages, fetchPolls } from "./api";
import { debtLines, type DebtLine, type DebtPayment } from "./debts";
import { dayIn } from "./timeline";
import type { ChatInfo, ChatMessage, ChatPerson, ChatPoll } from "./types";

export type ChatPage = {
  info: ChatInfo;
  people: ChatPerson[];
  messages: ChatMessage[];
  hasMore: boolean;
  // Las votaciones que hay entre esos mensajes
  polls: ChatPoll[];
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

  const { data: claims } = await supabase.auth.getClaims();
  const [people, page, membership] = await Promise.all([
    supabase.rpc("chat_people", { p_conversation: row.conversation_id }),
    fetchMessages(supabase, row.conversation_id),
    // Tu papel en el hogar ahora (para saber si eres menor)
    supabase
      .from("household_members")
      .select("role")
      .eq("household_id", householdId)
      .eq("user_id", claims?.claims.sub ?? "")
      .is("left_at", null)
      .maybeSingle(),
  ]);
  if (people.error) throw people.error;
  if (membership.error) throw membership.error;
  const polls = await fetchPolls(
    supabase,
    page.messages.filter((m) => m.kind === "poll").map((m) => m.id),
  );

  return {
    info: {
      conversationId: row.conversation_id,
      householdName: row.household_name,
      timezone: row.timezone,
      isResident: row.is_resident,
      isMinor: membership.data?.role === "minor",
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
    polls,
    today: dayIn(new Date().toISOString(), row.timezone),
  };
}

// ───────────── «Cuentas pendientes» (migración 29) ─────────────

// Una conversación de «Cuentas pendientes» lista para la página: el chat de siempre (sin votaciones) y, aparte,
// lo que hay entre tú y cada persona (debtLines) para la franja de arriba.
export type DebtChatPage = ChatPage & {
  householdId: string;
  departedId: string;
  departedName: string;
  // Eres tú quien se fue
  isMine: boolean;
  lines: DebtLine[];
};

export async function getDebtChatPage(conversationId: string): Promise<DebtChatPage | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims.sub;
  if (!me) return null;

  const { data, error } = await supabase.rpc("get_debt_chat", { p_conversation: conversationId });
  if (error) {
    if (error.message?.includes("Not allowed")) return null;
    throw error;
  }
  const row = (data ?? [])[0];
  if (!row) return null;

  const [people, parties, payments, page] = await Promise.all([
    supabase.rpc("chat_people", { p_conversation: conversationId }),
    supabase.rpc("debt_chat_parties", { p_conversation: conversationId }),
    supabase.rpc("debt_chat_payments", { p_conversation: conversationId }),
    fetchMessages(supabase, conversationId),
  ]);
  if (people.error) throw people.error;
  if (parties.error) throw parties.error;
  if (payments.error) throw payments.error;

  // El mismo ajuste automático que Gastos, solo entre quien se fue y su contraparte
  const transfers = suggestTransfers((parties.data ?? []).map((p) => ({ userId: p.user_id, netCents: Number(p.net_cents) })));
  const pending: DebtPayment[] = (payments.data ?? []).map((p) => ({
    id: p.id,
    fromUserId: p.from_user,
    toUserId: p.to_user,
    amountCents: Number(p.amount_cents),
    canAnswer: p.can_answer,
    canCancel: p.can_cancel,
  }));

  return {
    info: {
      conversationId,
      householdName: row.household_name,
      timezone: row.timezone,
      // Sin votaciones: no es el chat del hogar
      isResident: false,
      isMinor: false,
    },
    people: ((people.data ?? []) as { user_id: string; display_name: string; is_member: boolean; avatar_path: string | null }[]).map(
      (p) => ({ userId: p.user_id, name: p.display_name, isMember: p.is_member, avatarUrl: avatarUrl(p.avatar_path) }),
    ),
    messages: page.messages,
    hasMore: page.hasMore,
    polls: [],
    today: dayIn(new Date().toISOString(), row.timezone),
    householdId: row.household_id,
    departedId: row.departed_id,
    departedName: row.departed_name,
    isMine: row.departed_id === me,
    lines: debtLines(transfers, pending, me),
  };
}

// Tus conversaciones de «Cuentas pendientes» abiertas, de un hogar (pestaña Chat) o de todos (Inicio), con lo
// que hay entre tú y la otra persona.
export type DebtChatItem = {
  conversationId: string;
  householdId: string;
  householdName: string;
  departedName: string;
  isMine: boolean;
  unread: number;
  // Tu línea principal (la de más dinero); null si no hay nada entre tú y esa persona
  line: DebtLine | null;
  // Con quién es esa línea (nombre)
  otherName: string | null;
};

export async function getMyDebtChats(householdId?: string): Promise<DebtChatItem[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims.sub;
  if (!me) return [];

  const { data, error } = await supabase.rpc("my_debt_chats", householdId ? { p_household: householdId } : {});
  if (error) throw error;

  // Normalmente hay una o ninguna: se pide quién está en cada una para calcular las cantidades
  return Promise.all(
    (data ?? []).map(async (row) => {
      const { data: parties, error: partiesError } = await supabase.rpc("debt_chat_parties", {
        p_conversation: row.conversation_id,
      });
      if (partiesError) throw partiesError;
      const list = parties ?? [];
      const transfers = suggestTransfers(list.map((p) => ({ userId: p.user_id, netCents: Number(p.net_cents) })));
      const line = debtLines(transfers, [], me).sort((a, b) => b.amountCents - a.amountCents)[0] ?? null;
      return {
        conversationId: row.conversation_id,
        householdId: row.household_id,
        householdName: row.household_name,
        departedName: row.departed_name,
        isMine: row.is_mine,
        unread: Number(row.unread),
        line,
        otherName: line ? (list.find((p) => p.user_id === line.otherUserId)?.display_name ?? null) : null,
      };
    }),
  );
}
