// Traduce los errores de las funciones de la base de datos (migración 13) a claves de mensaje propias.
import type { ChatErrorKey } from "./types";

export function toChatErrorKey(error: { message?: string; code?: string }): ChatErrorKey {
  const message = error.message ?? "";
  if (message.includes("Write a message")) return "empty";
  if (message.includes("messages_body_length")) return "tooLong";
  if (message.includes("Too many messages")) return "tooMany";
  if (message.includes("only be edited for 15 minutes")) return "tooLate";
  if (message.includes("Message not found") || message.includes("only edit your own")) return "notFound";
  if (message.includes("Not allowed") || message.includes("Not authenticated")) return "notAllowed";
  console.error("[chat] error sin traducir:", error);
  return "generic";
}
