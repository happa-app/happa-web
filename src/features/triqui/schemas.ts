// Reglas del formulario de gasto y de pagos. La base de datos vuelve a comprobarlo todo (migración 8);
// aquí se valida antes para poder decir exactamente qué campo está mal.
import { z } from "zod";
import { MAX_AMOUNT_CENTS, parseAmount } from "./money";
import { SPLIT_METHODS, type SplitMethod, type TriquiErrorKey } from "./types";

export const uuidSchema = z.uuid();

// Lo que llega del formulario (todo texto; las listas, como JSON)
const expenseFormShape = z.object({
  description: z.string(),
  amount: z.string(),
  spentOn: z.string(),
  splitMethod: z.string(),
  payers: z.array(z.object({ userId: z.uuid(), amount: z.string() })).max(50),
  participants: z
    .array(z.object({ userId: z.uuid(), weight: z.string().optional(), amount: z.string().optional() }))
    .max(50),
});
export type ExpenseFormInput = z.input<typeof expenseFormShape>;

// Lo que se manda a create_expense / update_expense
export type ExpensePayload = {
  description: string;
  amountCents: number;
  spentOn: string;
  splitMethod: SplitMethod;
  payers: { user_id: string; amount_cents: number }[];
  shares: { user_id: string; weight?: number; amount_cents?: number }[];
};

type Field = "description" | "amount" | "spentOn" | "payers" | "participants";
export type BuildResult =
  | { ok: true; value: ExpensePayload }
  | { ok: false; fieldErrors: Partial<Record<Field, TriquiErrorKey>>; formError?: TriquiErrorKey };

export function buildExpense(input: unknown, today: string = isoToday()): BuildResult {
  const parsed = expenseFormShape.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: {}, formError: "generic" };
  const v = parsed.data;
  const fieldErrors: Partial<Record<Field, TriquiErrorKey>> = {};

  const description = v.description.trim();
  if (description.length === 0) fieldErrors.description = "descriptionRequired";
  else if (description.length > 80) fieldErrors.description = "descriptionTooLong";

  const amountCents = parseAmount(v.amount);
  if (amountCents === null || amountCents === 0) fieldErrors.amount = "amountInvalid";
  else if (amountCents > MAX_AMOUNT_CENTS) fieldErrors.amount = "amountTooBig";

  if (!isValidDate(v.spentOn) || v.spentOn < "2000-01-01" || v.spentOn > addDays(today, 1)) {
    fieldErrors.spentOn = "dateInvalid";
  }

  const splitMethod = SPLIT_METHODS.find((m) => m === v.splitMethod);
  if (!splitMethod) return { ok: false, fieldErrors, formError: "generic" };

  // Quién pagó. Si el importe no vale, no se comprueban las sumas: el error ya sale en el importe.
  const totalOk = !fieldErrors.amount;
  const payers: ExpensePayload["payers"] = [];
  if (v.payers.length === 0) fieldErrors.payers = "payersRequired";
  else if (!totalOk) {
    // nada más que comprobar hasta que haya un importe válido
  } else if (hasDuplicates(v.payers.map((p) => p.userId))) fieldErrors.payers = "payersMismatch";
  else {
    for (const p of v.payers) {
      const cents = parseAmount(p.amount);
      if (cents === null || cents === 0) {
        fieldErrors.payers = "payersMismatch";
        break;
      }
      payers.push({ user_id: p.userId, amount_cents: cents });
    }
    if (!fieldErrors.payers && amountCents !== null && sum(payers.map((p) => p.amount_cents)) !== amountCents) {
      fieldErrors.payers = "payersMismatch";
    }
  }

  // Entre quiénes se reparte
  const shares: ExpensePayload["shares"] = [];
  if (v.participants.length === 0) fieldErrors.participants = "participantsRequired";
  else if (hasDuplicates(v.participants.map((p) => p.userId))) fieldErrors.participants = "generic";
  else if (splitMethod === "equal") {
    for (const p of v.participants) shares.push({ user_id: p.userId });
  } else if (splitMethod === "shares") {
    for (const p of v.participants) {
      const weight = Number(p.weight ?? "");
      if (!/^\d{1,2}$/.test((p.weight ?? "").trim()) || weight < 1 || weight > 99) {
        fieldErrors.participants = "weightInvalid";
        break;
      }
      shares.push({ user_id: p.userId, weight });
    }
  } else if (totalOk) {
    for (const p of v.participants) {
      const cents = parseAmount(p.amount ?? "");
      if (cents === null || cents === 0) {
        fieldErrors.participants = "sharesMismatch";
        break;
      }
      shares.push({ user_id: p.userId, amount_cents: cents });
    }
    if (!fieldErrors.participants && amountCents !== null && sum(shares.map((s) => s.amount_cents ?? 0)) !== amountCents) {
      fieldErrors.participants = "sharesMismatch";
    }
  }

  if (Object.keys(fieldErrors).length > 0 || amountCents === null) return { ok: false, fieldErrors };
  return { ok: true, value: { description, amountCents, spentOn: v.spentOn, splitMethod, payers, shares } };
}

// Un pago: cuánto (texto) → céntimos
export function parsePaymentAmount(text: string): number | null {
  const cents = parseAmount(text);
  return cents === null || cents === 0 || cents > MAX_AMOUNT_CENTS ? null : cents;
}

// ─── utilidades ───
export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
