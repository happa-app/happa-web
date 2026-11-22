// Traduce los errores de las funciones del corcho (migración 32) a claves de mensaje propias.
import type { BoardErrorKey } from "./schemas";

export function toBoardErrorKey(error: { message?: string; code?: string }): BoardErrorKey {
  const message = error.message ?? "";
  if (message.includes("household_wifi_ssid_length")) return "ssidRequired";
  if (message.includes("Invalid wifi") || message.includes("household_wifi_password_valid")) return "passwordInvalid";
  if (message.includes("household_payments_label_length")) return "labelRequired";
  if (message.includes("Invalid IBAN")) return "ibanInvalid";
  if (message.includes("Invalid Bizum number")) return "bizumInvalid";
  if (message.includes("Too many payments")) return "tooManyPayments";
  if (message.includes("board_notes_body_length")) return "bodyRequired";
  if (message.includes("Too many notes")) return "tooManyNotes";
  if (
    message.includes("Only adult members can manage the board") ||
    message.includes("Only an adult can pin notes") ||
    message.includes("Not authenticated")
  ) {
    return "onlyAdults";
  }
  if (message.includes("You can only remove your own notes")) return "onlyOwn";
  if (message.includes("Not found")) return "notFound";
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[corcho] error sin traducir:", error);
  return "generic";
}
