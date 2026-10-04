// Lecturas de gastos para las páginas (se ejecutan en el servidor).
// En la base de datos esta parte se llamaba "triqui": por eso algunas funciones conservan ese nombre
// (get_triqui_balances, get_triqui_context...). Solo es el nombre interno; en la app no aparece.
// RLS ya filtra: solo llegan los gastos y pagos del hogar si puedes verlos (migración 8).
import { createClient } from "@/lib/supabase/server";
import type {
  BalancePerson,
  Expense,
  ExpenseSource,
  ExpensesContext,
  ExpensesOverview,
  ExpenseStatus,
  Frequency,
  LeftDebt,
  Payment,
  RecurringExpense,
  RecurringSplitMethod,
  SplitMethod,
} from "./types";

const EXPENSE_FIELDS =
  "id, description, amount_cents, spent_on, split_method, source, recurring_id, status, version, created_by, created_at, updated_by, rejected_by, rejected_reason, " +
  "expense_payers(user_id, amount_cents), expense_shares(user_id, weight, amount_cents), expense_confirmations(user_id), " +
  "expense_items(position, name, quantity)";

const RECURRING_FIELDS =
  "id, description, amount_cents, frequency, interval_count, starts_on, next_charge_on, paid_by, split_method, status, version, active, charges_made, first_confirmed_at, created_by, rejected_by, rejected_reason, " +
  "recurring_expense_shares(user_id, weight), recurring_expense_confirmations(user_id), charges:expenses(count)";

const PAYMENT_FIELDS = "id, from_user, to_user, amount_cents, settled_on, status, created_at";

type ExpenseRow = {
  id: string;
  description: string;
  amount_cents: number;
  spent_on: string;
  split_method: SplitMethod;
  source: ExpenseSource;
  recurring_id: string | null;
  status: ExpenseStatus;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  rejected_by: string | null;
  rejected_reason: string | null;
  expense_payers: { user_id: string; amount_cents: number }[];
  expense_shares: { user_id: string; weight: number | null; amount_cents: number }[];
  expense_confirmations: { user_id: string }[];
  expense_items: { position: number; name: string; quantity: number }[];
};

type RecurringRow = {
  id: string;
  description: string;
  amount_cents: number;
  frequency: Frequency;
  interval_count: number;
  starts_on: string;
  next_charge_on: string;
  paid_by: string;
  split_method: RecurringSplitMethod;
  status: ExpenseStatus;
  version: number;
  active: boolean;
  charges_made: number;
  first_confirmed_at: string | null;
  created_by: string | null;
  rejected_by: string | null;
  rejected_reason: string | null;
  // Cuántos cargos hay apuntados (los que puedes ver)
  charges: { count: number }[];
  recurring_expense_shares: { user_id: string; weight: number | null }[];
  recurring_expense_confirmations: { user_id: string }[];
};

type PaymentRow = {
  id: string;
  from_user: string;
  to_user: string;
  amount_cents: number;
  settled_on: string;
  status: ExpenseStatus;
  created_at: string;
};

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    spentOn: row.spent_on,
    splitMethod: row.split_method,
    source: row.source,
    recurringId: row.recurring_id,
    items: [...(row.expense_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ name: i.name, quantity: i.quantity })),
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

function toRecurring(row: RecurringRow): RecurringExpense {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    frequency: row.frequency,
    interval: row.interval_count,
    startsOn: row.starts_on,
    nextChargeOn: row.next_charge_on,
    paidBy: row.paid_by,
    splitMethod: row.split_method,
    status: row.status,
    version: row.version,
    active: row.active,
    chargesMade: row.charges_made,
    everConfirmed: row.first_confirmed_at !== null,
    hasCharges: (row.charges?.[0]?.count ?? 0) > 0,
    createdBy: row.created_by,
    rejectedBy: row.rejected_by,
    rejectedReason: row.rejected_reason,
    shares: row.recurring_expense_shares.map((s) => ({ userId: s.user_id, weight: s.weight })),
    confirmedBy: row.recurring_expense_confirmations.map((c) => c.user_id),
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
export async function getBalances(householdId: string): Promise<BalancePerson[]> {
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

// Apunta los cargos de los gastos fijos que tocan (hasta hoy). Se llama antes de leer saldos y gastos.
// Si falla, la página se enseña igual (con lo que ya hubiera apuntado): el error solo queda en el registro.
export async function syncRecurringExpenses(householdId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_recurring_expenses", { p_household: householdId });
  if (error) console.error("[gastos] no se pudieron poner al día los gastos fijos:", error);
}

// Gastos fijos del hogar: primero los que esperan confirmación, luego por próximo cargo
export async function getRecurringExpenses(householdId: string): Promise<RecurringExpense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(RECURRING_FIELDS)
    .eq("household_id", householdId)
    .order("next_charge_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const list = ((data ?? []) as unknown as RecurringRow[]).map(toRecurring);
  // Los que esperan confirmación, arriba (sort mantiene el orden por próximo cargo dentro de cada grupo)
  return list.sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
}

// Un gasto fijo (para editarlo). null si no existe o no puedes verlo.
export async function getRecurringExpense(householdId: string, recurringId: string): Promise<RecurringExpense | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(RECURRING_FIELDS)
    .eq("household_id", householdId)
    .eq("id", recurringId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecurring(data as unknown as RecurringRow) : null;
}

export async function getExpensesOverview(householdId: string): Promise<ExpensesOverview> {
  const supabase = await createClient();
  // Primero se apuntan los gastos fijos que tocan, para que los saldos ya los incluyan
  await syncRecurringExpenses(householdId);
  // Historial reciente y, aparte y sin límite, todo lo pendiente (para que nunca se quede fuera de la vista)
  const [people, recentExpenses, pendingExpenses, recentPayments, pendingPayments, recurring] = await Promise.all([
    getBalances(householdId),
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
    getRecurringExpenses(householdId),
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

  return { people, expenses, payments, recurring };
}

function mergeById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map((r) => [r.id, r])).values()];
}

// Datos del hogar para las pantallas de gastos. null si no puedes verlo.
export async function getExpensesContext(householdId: string): Promise<ExpensesContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_triqui_context", { p_household: householdId });
  // "Not allowed" (o un id que no existe) → no hay gastos para ti
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
): Promise<{ expense: Expense; people: BalancePerson[] } | null> {
  const supabase = await createClient();
  const [people, { data, error }] = await Promise.all([
    getBalances(householdId),
    supabase.from("expenses").select(EXPENSE_FIELDS).eq("household_id", householdId).eq("id", expenseId).maybeSingle(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return { expense: toExpense(data as unknown as ExpenseRow), people };
}

// Para la tarjeta del hogar: tu saldo y cuántas cosas esperan que las confirmes.
export async function getMyExpensesSummary(
  householdId: string,
  userId: string,
): Promise<{ netCents: number; toConfirm: number }> {
  const supabase = await createClient();
  await syncRecurringExpenses(householdId);
  const [people, pendingExpenses, pendingPayments, pendingRecurring] = await Promise.all([
    getBalances(householdId),
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
    supabase
      .from("recurring_expenses")
      .select("id, paid_by, recurring_expense_shares(user_id), recurring_expense_confirmations(user_id)")
      .eq("household_id", householdId)
      .eq("status", "pending"),
  ]);
  if (pendingExpenses.error) throw pendingExpenses.error;
  if (pendingPayments.error) throw pendingPayments.error;
  if (pendingRecurring.error) throw pendingRecurring.error;

  type Row = { expense_payers: { user_id: string }[]; expense_shares: { user_id: string }[]; expense_confirmations: { user_id: string }[] };
  const expensesToConfirm = ((pendingExpenses.data ?? []) as unknown as Row[]).filter(
    (e) =>
      [...e.expense_payers, ...e.expense_shares].some((p) => p.user_id === userId) &&
      !e.expense_confirmations.some((c) => c.user_id === userId),
  ).length;

  type RecurringPending = {
    paid_by: string;
    recurring_expense_shares: { user_id: string }[];
    recurring_expense_confirmations: { user_id: string }[];
  };
  const recurringToConfirm = ((pendingRecurring.data ?? []) as unknown as RecurringPending[]).filter(
    (r) =>
      (r.paid_by === userId || r.recurring_expense_shares.some((s) => s.user_id === userId)) &&
      !r.recurring_expense_confirmations.some((c) => c.user_id === userId),
  ).length;

  return {
    netCents: people.find((p) => p.userId === userId)?.netCents ?? 0,
    toConfirm: expensesToConfirm + (pendingPayments.count ?? 0) + recurringToConfirm,
  };
}
