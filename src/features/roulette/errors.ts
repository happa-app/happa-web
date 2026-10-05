// Traduce los errores de la base de datos (los "raise exception" de la migración 16) a claves de mensaje.
import type { RouletteErrorKey } from "./types";

export function toRouletteErrorKey(error: { message?: string }): RouletteErrorKey {
  const message = error.message ?? "";
  if (message.includes("Title is required")) return "titleRequired";
  if (message.includes("Title is too long")) return "titleTooLong";
  if (message.includes("At least two people")) return "needTwo";
  if (message.includes("Too many people")) return "tooManyPeople";
  if (message.includes("does not live here")) return "notResident";
  if (message.includes("Only adults")) return "onlyAdults";
  if (message.includes("Too many spins")) return "tooManySpins";
  console.error("[ruleta] error sin traducir:", error);
  return "generic";
}
