// Tipos del triqui. Los importes van siempre en céntimos (números enteros).

export const SPLIT_METHODS = ["equal", "shares", "exact"] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

export type TriquiStatus = "pending" | "confirmed" | "rejected";

// Una persona del triqui: adultos actuales y cualquiera que haya participado (aunque se fuera)
export type TriquiPerson = {
  userId: string;
  name: string;
  isCurrent: boolean;
  // Positivo: le deben. Negativo: debe.
  netCents: number;
};

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  spentOn: string; // AAAA-MM-DD
  splitMethod: SplitMethod;
  status: TriquiStatus;
  // Sube cada vez que se edita; confirmar o cambiar exige la versión que se tenía en pantalla
  version: number;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  rejectedBy: string | null;
  rejectedReason: string | null;
  payers: { userId: string; amountCents: number }[];
  shares: { userId: string; weight: number | null; amountCents: number }[];
  confirmedBy: string[];
};

export type Payment = {
  id: string;
  fromUser: string;
  toUser: string;
  amountCents: number;
  settledOn: string;
  status: TriquiStatus;
  createdAt: string;
};

// Datos del hogar para el triqui (también para quien se fue con saldo pendiente)
export type TriquiContext = { name: string; timezone: string; isCurrent: boolean; isAdmin: boolean };

// Hogares que dejaste donde aún tienes saldo
export type LeftDebt = { householdId: string; name: string; netCents: number };

// Una transferencia sugerida para quedar en paz
export type Transfer = { from: string; to: string; amountCents: number };

export type TriquiOverview = {
  people: TriquiPerson[];
  expenses: Expense[];
  payments: Payment[];
};

// Errores que pueden ver los usuarios (claves de messages/*.json → Triqui.errors)
export const TRIQUI_ERROR_KEYS = [
  "descriptionRequired",
  "descriptionTooLong",
  "amountInvalid",
  "amountTooBig",
  "dateInvalid",
  "payersRequired",
  "payersMismatch",
  "participantsRequired",
  "weightInvalid",
  "sharesMismatch",
  "participantGone",
  "notAllowed",
  "notPending",
  "expenseChanged",
  "generic",
] as const;
export type TriquiErrorKey = (typeof TRIQUI_ERROR_KEYS)[number];

export type ExpenseFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<"description" | "amount" | "spentOn" | "payers" | "participants", TriquiErrorKey>>;
  formError?: TriquiErrorKey;
};

export type TriquiActionState = { status: "idle" | "error"; error?: TriquiErrorKey };
export const initialTriquiActionState: TriquiActionState = { status: "idle" };
