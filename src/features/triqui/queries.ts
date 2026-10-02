// Lecturas del triqui para las páginas (se ejecutan en el servidor).
// RLS ya filtra: solo llegan los gastos y pagos del hogar si puedes verlos (migración 8).
import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  LeftDebt,
  Payment,
  SplitMethod,
  TriquiContext,
  TriquiOverview,
  TriquiPerson,
  TriquiStatus,
} from "./types";

const EXPENSE_FIELDS =
  "id, description, amount_cents, spent_on, split_method, status, version, created_by, created_at, updated_by, rejected_by, rejected_reason, " +
  "expense_payers(user_id, amount_cents), expense_shares(user_id, weight, amount_cents), expense_confirmations(user_id)";

const PAYMENT_FIELDS = "id, from_user, to_user, amount_cents, settled_on, status, created_at";

type ExpenseRow = {
  id: string;
  description: string;
  amount_cents: number;
  spent_on: string;
  split_method: SplitMethod;
  status: TriquiStatus;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  rejected_by: string | null;
  rejected_reason: string | null;
  expense_payers: { user_id: string; amount_cents: number }[];
  expense_shares: { user_id: string; weight: number | null; amount_cents: number }[];
  expense_confirmations: { user_id: string }[];
};

type PaymentRow = {
  id: string;
  from_user: string;
  to_user: string;
  amount_cents: number;
  settled_on: string;
  status: TriquiStatus;
  created_at: string;
};

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    spentOn: row.spent_on,
    splitMethod: row.split_method,
    status: row.status,
    version: row.version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    rejectedBy: row.rejected_by,
    rejectedReason: row.rejected_reason,
    payers: row.expense_payers.map((p) => ({ userId: p.user_id, amountCents: p.amount_cents })),
    shares: row.expense_shares.map((s) => ({ userId: s.user_id, weight: s.weight, amountCents: s.amount_cents })),
    confirmedBy: row.expense_confirmations.map((c) => c.user_id),
  };
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    fromUser: row.from_user,
    toUser: row.to_user,
    amountCents: row.amount_cents,
    settledOn: row.settled_on,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Saldos de todos (adultos actuales y quien haya participado). Lo calcula la base de datos.
export async function getTriquiPeople(householdId: string): Promise<TriquiPerson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_triqui_balances", { p_household: householdId });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    userId: p.user_id,
    name: p.display_name,
    isCurrent: p.is_current,
    netCents: Number(p.net_cents),
  }));
}

export async function getTriquiOverview(householdId: string): Promise<TriquiOverview> {
  const supabase = await createClient();
  // Historial reciente y, aparte y sin límite, todo lo pendiente (para que nunca se quede fuera de la vista)
  const [people, recentExpenses, pendingExpenses, recentPayments, pendingPayments] = await Promise.all([
    getTriquiPeople(householdId),
    supabase
      .from("expenses")
      .select(EXPENSE_FIELDS)
      .eq("household_id", householdId)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("expenses").select(EXPENSE_FIELDS).eq("household_id", householdId).eq("status", "pending"),
    supabase
      .from("settlements")
      .select(PAYMENT_FIELDS)
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("settlements").select(PAYMENT_FIELDS).eq("household_id", householdId).eq("status", "pending"),
  ]);
  for (const r of [recentExpenses, pendingExpenses, recentPayments, pendingPayments]) if (r.error) throw r.error;

  const expenses = mergeById([
    ...((recentExpenses.data ?? []) as unknown as ExpenseRow[]),
    ...((pendingExpenses.data ?? []) as unknown as ExpenseRow[]),
  ])
    .map(toExpense)
    .sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt.localeCompare(a.createdAt));
  const payments = mergeById([
    ...((recentPayments.data ?? []) as PaymentRow[]),
    ...((pendingPayments.data ?? []) as PaymentRow[]),
  ])
    .map(toPayment)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { people, expenses, payments };
}

function mergeById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map((r) => [r.id, r])).values()];
}

// Datos del hogar para las pantallas del triqui. null si no puedes verlo.
export async function getTriquiContext(householdId: string): Promise<TriquiContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_triqui_context", { p_household: householdId });
  // "Not allowed" (o un id que no existe) → no hay triqui para ti
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { name: row.name, timezone: row.timezone, isCurrent: row.is_current, isAdmin: row.is_admin };
}

// Hogares que dejaste donde aún tienes saldo pendiente (para avisar en Inicio)
export async function getMyLeftDebts(): Promise<LeftDebt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_triqui_debts");
  if (error) throw error;
  return (data ?? []).map((d) => ({ householdId: d.household_id, name: d.name, netCents: Number(d.net_cents) }));
}

// Un gasto con los saldos (para los nombres). null si no existe o no puedes verlo.
export async function getExpense(
  householdId: string,
  expenseId: string,
): Promise<{ expense: Expense; people: TriquiPerson[] } | null> {
  const supabase = await createClient();
  const [people, { data, error }] = await Promise.all([
    getTriquiPeople(householdId),
    supabase.from("expenses").select(EXPENSE_FIELDS).eq("household_id", householdId).eq("id", expenseId).maybeSingle(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return { expense: toExpense(data as unknown as ExpenseRow), people };
}

// Para la tarjeta del hogar: tu saldo y cuántas cosas esperan que las confirmes.
export async function getMyTriquiSummary(
  householdId: string,
  userId: string,
): Promise<{ netCents: number; toConfirm: number }> {
  const supabase = await createClient();
  const [people, pendingExpenses, pendingPayments] = await Promise.all([
    getTriquiPeople(householdId),
    supabase
      .from("expenses")
      .select("id, expense_payers(user_id), expense_shares(user_id), expense_confirmations(user_id)")
      .eq("household_id", householdId)
      .eq("status", "pending"),
    supabase
      .from("settlements")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("to_user", userId)
      .eq("status", "pending"),
  ]);
  if (pendingExpenses.error) throw pendingExpenses.error;
  if (pendingPayments.error) throw pendingPayments.error;

  type Row = { expense_payers: { user_id: string }[]; expense_shares: { user_id: string }[]; expense_confirmations: { user_id: string }[] };
  const expensesToConfirm = ((pendingExpenses.data ?? []) as unknown as Row[]).filter(
    (e) =>
      [...e.expense_payers, ...e.expense_shares].some((p) => p.user_id === userId) &&
      !e.expense_confirmations.some((c) => c.user_id === userId),
  ).length;

  return {
    netCents: people.find((p) => p.userId === userId)?.netCents ?? 0,
    toConfirm: expensesToConfirm + (pendingPayments.count ?? 0),
  };
}
