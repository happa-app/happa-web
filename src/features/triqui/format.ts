// Utilidades para enseñar datos del triqui (sin acceso a la base de datos: valen en servidor y navegador).
import type { Expense, TriquiPerson } from "./types";

// "2 oct" / "Oct 2". Las fechas del triqui son días sin hora: se leen en UTC para que no cambien de día.
export function formatDay(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

// Hoy en una zona horaria, como AAAA-MM-DD (para el valor por defecto de la fecha de un gasto)
export function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function nameMap(people: TriquiPerson[]): Map<string, string> {
  return new Map(people.map((p) => [p.userId, p.name]));
}

// Quién participa en un gasto (pagó o le toca pagar), sin repetir
export function participantsOf(expense: Expense): string[] {
  return [...new Set([...expense.payers.map((p) => p.userId), ...expense.shares.map((s) => s.userId)])];
}

// Cómo te afecta un gasto: lo que pusiste menos lo que te toca (positivo: te deben)
export function myEffect(expense: Expense, userId: string): { involved: boolean; netCents: number; shareCents: number } {
  const paid = expense.payers.find((p) => p.userId === userId)?.amountCents ?? 0;
  const share = expense.shares.find((s) => s.userId === userId)?.amountCents ?? 0;
  return { involved: participantsOf(expense).includes(userId), netCents: paid - share, shareCents: share };
}

// Gastos pendientes que esperan tu confirmación
export function waitingForMe(expense: Expense, userId: string): boolean {
  return expense.status === "pending" && participantsOf(expense).includes(userId) && !expense.confirmedBy.includes(userId);
}
