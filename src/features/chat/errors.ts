// Traduce los errores de las funciones de la base de datos (migraciones 13 y 21) a claves de mensaje propias.
import type { ChatErrorKey } from "./types";

export function toChatErrorKey(error: { message?: string; code?: string }): ChatErrorKey {
  const message = error.message ?? "";
  if (message.includes("Write a message")) return "empty";
  if (message.includes("messages_body_length")) return "tooLong";
  if (message.includes("Too many messages")) return "tooMany";
  if (message.includes("only be edited for 15 minutes")) return "tooLate";
  if (message.includes("Message not found") || message.includes("only edit your own")) return "notFound";
  if (message.includes("Not allowed") || message.includes("Not authenticated")) return "notAllowed";
  // Migración 21: votaciones
  if (message.includes("Invalid poll question")) return "pollQuestion";
  if (message.includes("between 2 and 10 options") || message.includes("Invalid poll option")) return "pollOptions";
  if (message.includes("Repeated poll option")) return "pollRepeated";
  if (message.includes("Only adults living")) return "pollAdultsOnly";
  if (message.includes("Only people living") || message.includes("Minors cannot vote")) return "pollCannotVote";
  if (message.includes("Poll not found") || message.includes("Polls cannot be edited")) return "notFound";
  if (message.includes("Choose only one option")) return "generic";
  console.error("[chat] error sin traducir:", error);
  return "generic";
}
