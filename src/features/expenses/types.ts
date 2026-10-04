// Tipos de gastos. Los importes van siempre en céntimos (números enteros).

export const SPLIT_METHODS = ["equal", "shares", "exact"] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

export type ExpenseStatus = "pending" | "confirmed" | "rejected";

// Una persona en los gastos del hogar: adultos actuales y cualquiera que haya participado (aunque se fuera)
export type BalancePerson = {
  userId: string;
  name: string;
  isCurrent: boolean;
  // Positivo: le deben. Negativo: debe.
  netCents: number;
};

// De dónde viene un gasto: apuntado a mano, de la lista de la compra o de un gasto fijo
export type ExpenseSource = "manual" | "shopping" | "recurring" | "landlord";

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  spentOn: string; // AAAA-MM-DD
  splitMethod: SplitMethod;
  source: ExpenseSource;
  // Si es un cargo de un gasto fijo, cuál (null si el gasto fijo ya se borró)
  recurringId: string | null;
  // Si viene de la compra, los productos que entraron
  items: { name: string; quantity: number }[];
  status: ExpenseStatus;
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
  status: ExpenseStatus;
  createdAt: string;
};

// Datos del hogar para gastos (también para quien se fue con saldo pendiente)
export type ExpensesContext = { name: string; timezone: string; isCurrent: boolean; isAdmin: boolean };

// Hogares que dejaste donde aún tienes saldo
export type LeftDebt = { householdId: string; name: string; netCents: number };

// Una transferencia sugerida para quedar en paz
export type Transfer = { from: string; to: string; amountCents: number };

export type ExpensesOverview = {
  people: BalancePerson[];
  expenses: Expense[];
  payments: Payment[];
  recurring: RecurringExpense[];
};

// ─── Gastos fijos ───
export const FREQUENCIES = ["weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
// Los gastos fijos se reparten a partes iguales o por partes (los importes exactos no tienen sentido
// cuando cambia quién vive en casa)
export const RECURRING_SPLIT_METHODS = ["equal", "shares"] as const;
export type RecurringSplitMethod = (typeof RECURRING_SPLIT_METHODS)[number];

export type RecurringExpense = {
  id: string;
  description: string;
  amountCents: number;
  frequency: Frequency;
  startsOn: string; // primer cargo, AAAA-MM-DD
  nextChargeOn: string;
  paidBy: string;
  splitMethod: RecurringSplitMethod;
  status: ExpenseStatus;
  version: number;
  // false = en pausa
  active: boolean;
  chargesMade: number;
  // Ya se confirmó alguna vez: desde entonces solo un admin lo edita o lo borra
  everConfirmed: boolean;
  // Ya tiene cargos apuntados: no se puede cambiar cuándo se cobra
  hasCharges: boolean;
  createdBy: string | null;
  rejectedBy: string | null;
  rejectedReason: string | null;
  shares: { userId: string; weight: number | null }[];
  confirmedBy: string[];
};

// Un producto comprado de la lista común, para pasarlo a un gasto
export type BoughtItem = { id: string; name: string; quantity: number; checkedBy: string | null };

// Errores que pueden ver los usuarios (claves de messages/*.json → Expenses.errors)
export const EXPENSES_ERROR_KEYS = [
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
  "itemsRequired",
  "itemsGone",
  "startInvalid",
  "scheduleLocked",
  "generic",
] as const;
export type ExpensesErrorKey = (typeof EXPENSES_ERROR_KEYS)[number];

export type ExpenseFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<"description" | "amount" | "spentOn" | "payers" | "participants" | "items", ExpensesErrorKey>>;
  formError?: ExpensesErrorKey;
};

export type RecurringFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<"description" | "amount" | "startsOn" | "paidBy" | "participants", ExpensesErrorKey>>;
  formError?: ExpensesErrorKey;
};

export type ExpensesActionState = { status: "idle" | "error"; error?: ExpensesErrorKey };
export const initialExpensesActionState: ExpensesActionState = { status: "idle" };
