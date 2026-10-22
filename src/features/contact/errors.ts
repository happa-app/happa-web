// Traduce los errores de la función send_contact_message (migración 20) a claves de mensaje propias.
import type { ContactErrorKey } from "./types";

export function toContactErrorKey(error: { message?: string; code?: string }): ContactErrorKey {
  const message = error.message ?? "";
  if (message.includes("Too many contact messages")) return "rateLimited";
  if (message.includes("Invalid contact message")) return "messageRequired";
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[contact] error sin traducir:", error);
  return "generic";
}
