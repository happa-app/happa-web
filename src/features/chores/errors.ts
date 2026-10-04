// Traduce los errores de las funciones de la base de datos (migración 12) a claves de mensaje propias.
import type { ChoreErrorKey } from "./types";

export function toChoreErrorKey(error: { message?: string; code?: string }): ChoreErrorKey {
  const message = error.message ?? "";
  if (message.includes("chores_title_length")) return "titleRequired";
  if (message.includes("chores_notes_length")) return "notesTooLong";
  if (message.includes("Choose at least one day") || message.includes("Invalid weekday")) return "daysRequired";
  if (message.includes("Invalid start date")) return "startInvalid";
  if (message.includes("A fixed chore needs exactly one person")) return "personRequired";
  if (message.includes("Choose who takes turns")) return "rotationRequired";
  if (message.includes("Everyone in a chore must live in the household")) return "personGone";
  if (message.includes("This chore is already done")) return "alreadyDone";
  if (message.includes("This chore is not done")) return "notDone";
  if (message.includes("not waiting for approval")) return "notWaiting";
  if (message.includes("You can only mark your own chores")) return "onlyOwn";
  if (message.includes("This chore already has someone")) return "taken";
  if (message.includes("Chore not found")) return "notFound";
  if (
    message.includes("Only adult members can manage chores") ||
    message.includes("Only an adult can approve chores") ||
    message.includes("Not allowed") ||
    message.includes("Not authenticated")
  ) {
    return "notAllowed";
  }
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[tareas] error sin traducir:", error);
  return "generic";
}
