// Traduce los errores de las funciones de la base de datos a claves de mensaje propias.
// Los textos vienen de los "raise exception" de las migraciones 1 y 3.
import type { HouseholdErrorKey } from "./types";

export function toHouseholdErrorKey(error: { message?: string; code?: string }): HouseholdErrorKey {
  const message = error.message ?? "";
  if (message.includes("Invalid invite code")) return "codeInvalid";
  if (message.includes("Minor accounts cannot create")) return "minorCannotCreate";
  if (message.includes("Minor accounts are added")) return "minorCannotJoin";
  if (message.includes("Professional accounts")) return "professionalCannotJoin";
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[households] error sin traducir:", error);
  return "generic";
}
