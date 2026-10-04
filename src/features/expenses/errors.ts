// Traduce los errores de las funciones de la base de datos a claves de mensaje propias.
// Los textos vienen de los "raise exception" de las migraciones 8 y 9.
import type { ExpensesErrorKey } from "./types";

export function toExpensesErrorKey(error: { message?: string; code?: string }): ExpensesErrorKey {
  const message = error.message ?? "";
  if (message.includes("Payers must add up") || message.includes("Each payer needs")) return "payersMismatch";
  if (message.includes("Shares must add up") || message.includes("Each share needs a positive")) return "sharesMismatch";
  if (message.includes("between 1 and 99")) return "weightInvalid";
  if (message.includes("must be an adult member of the household")) return "participantGone";
  if (message.includes("Invalid date")) return "dateInvalid";
  if (message.includes("Invalid start date")) return "startInvalid";
  if (message.includes("cannot change after the first charge")) return "scheduleLocked";
  if (message.includes("Choose at least one bought item")) return "itemsRequired";
  if (message.includes("no longer in the bought list")) return "itemsGone";
  if (message.includes("Expense changed")) return "expenseChanged";
  if (message.includes("not waiting for") || message.includes("already answered")) return "notPending";
  if (
    message.includes("Only adult members") ||
    message.includes("You cannot") ||
    message.includes("Only people in the expense") ||
    message.includes("Only an admin") ||
    message.includes("You can only record payments") ||
    message.includes("Both people must be") ||
    message.includes("Expense not found") ||
    message.includes("Not allowed")
  ) {
    return "notAllowed";
  }
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[gastos] error sin traducir:", error);
  return "generic";
}
