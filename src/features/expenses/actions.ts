"use server";
// Acciones de gastos. Todas llaman a funciones de la base de datos (migraciones 8 y 9), que son las que
// comprueban permisos, reparten y confirman: aquí solo se validan los datos del formulario.
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { schedulePushDispatch } from "@/lib/push/schedule";
import { createClient } from "@/lib/supabase/server";
import { toExpensesErrorKey } from "./errors";
import { buildExpense, buildRecurring, parseItemIds, parsePaymentAmount, uuidSchema } from "./schemas";
import type { ExpenseFormState, ExpensesActionState, RecurringFormState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function json(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Versión del gasto que se tenía en pantalla (si falta, la base de datos lo rechaza)
function version(formData: FormData): number {
  const n = Number(text(formData, "version"));
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function id(formData: FormData, key: string): string | null {
  const parsed = uuidSchema.safeParse(text(formData, key));
  return parsed.success ? parsed.data : null;
}

// Crear o editar un gasto (si llega expenseId, se edita). Si llegan productos (items), es un gasto
// nuevo que viene de la lista de la compra: esos productos salen de la lista al guardarlo.
export async function saveExpense(_prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const expenseId = text(formData, "expenseId") ? id(formData, "expenseId") : null;
  if (!householdId || (text(formData, "expenseId") && !expenseId)) return { status: "error", formError: "generic" };
  const fromShopping = formData.has("items");
  const itemIds = fromShopping ? parseItemIds(json(text(formData, "items"))) : null;
  if (fromShopping && expenseId) return { status: "error", formError: "generic" };

  const built = buildExpense({
    description: text(formData, "description"),
    amount: text(formData, "amount"),
    spentOn: text(formData, "spentOn"),
    splitMethod: text(formData, "splitMethod"),
    payers: json(text(formData, "payers")),
    participants: json(text(formData, "participants")),
  });
  if (!built.ok || (fromShopping && !itemIds)) {
    return {
      status: "error",
      fieldErrors: { ...(built.ok ? {} : built.fieldErrors), ...(fromShopping && !itemIds ? { items: "itemsRequired" as const } : {}) },
      formError: built.ok ? undefined : built.formError,
    };
  }

  const v = built.value;
  const args = {
    p_description: v.description,
    p_amount_cents: v.amountCents,
    p_spent_on: v.spentOn,
    p_split_method: v.splitMethod,
    p_payers: v.payers,
    p_shares: v.shares,
  };
  const supabase = await createClient();
  const { error } = expenseId
    ? await supabase.rpc("update_expense", { p_expense: expenseId, p_version: version(formData), ...args })
    : itemIds
      ? await supabase.rpc("create_expense_from_shopping", { p_household: householdId, p_items: itemIds, ...args })
      : await supabase.rpc("create_expense", { p_household: householdId, ...args });
  if (error) {
    const key = toExpensesErrorKey(error);
    return key === "itemsRequired" || key === "itemsGone"
      ? { status: "error", fieldErrors: { items: key } }
      : { status: "error", formError: key };
  }

  return redirect({ href: expenseId ? `/hogar/${householdId}/gastos/${expenseId}` : `/hogar/${householdId}/gastos`, locale });
}

// Confirmar, rechazar, dar por bueno o borrar un gasto
export async function expenseAction(_prevState: ExpensesActionState, formData: FormData): Promise<ExpensesActionState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const expenseId = id(formData, "expenseId");
  const intent = text(formData, "intent");
  if (!householdId || !expenseId) return { status: "error", error: "generic" };

  const supabase = await createClient();
  let result: { error: { message?: string; code?: string } | null };
  const p_version = version(formData);
  if (intent === "confirm") result = await supabase.rpc("confirm_expense", { p_expense: expenseId, p_version });
  else if (intent === "reject") {
    const reason = text(formData, "reason").trim().slice(0, 200);
    result = await supabase.rpc("reject_expense", { p_expense: expenseId, p_version, p_reason: reason || undefined });
  } else if (intent === "forceConfirm") result = await supabase.rpc("force_confirm_expense", { p_expense: expenseId, p_version });
  else if (intent === "delete") result = await supabase.rpc("delete_expense", { p_expense: expenseId, p_version });
  else return { status: "error", error: "generic" };

  if (result.error) return { status: "error", error: toExpensesErrorKey(result.error) };

  // Tras borrar, a la lista; si no, de vuelta a donde estaba (la lista o el gasto)
  const backToList = intent === "delete" || text(formData, "returnTo") === "list";
  return redirect({
    href: backToList ? `/hogar/${householdId}/gastos` : `/hogar/${householdId}/gastos/${expenseId}`,
    locale,
  });
}

// Pagos: "He pagado" (lo apunta quien paga), "Me ha pagado" (quien recibe), y confirmar,
// rechazar o retirar uno pendiente.
export async function paymentAction(_prevState: ExpensesActionState, formData: FormData): Promise<ExpensesActionState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const intent = text(formData, "intent");
  if (!householdId) return { status: "error", error: "generic" };

  const supabase = await createClient();
  let result: { error: { message?: string; code?: string } | null };

  if (intent === "paid" || intent === "received") {
    const otherId = id(formData, "otherUserId");
    const amountCents = parsePaymentAmount(text(formData, "amount"));
    if (!otherId) return { status: "error", error: "generic" };
    if (amountCents === null) return { status: "error", error: "amountInvalid" };

    const { data } = await supabase.auth.getClaims();
    const me = data?.claims.sub;
    if (!me) return { status: "error", error: "notAllowed" };

    // Fecha de hoy en la zona horaria del hogar (la manda la página); la base de datos la comprueba
    const today = text(formData, "today");
    result = await supabase.rpc("record_payment", {
      p_household: householdId,
      p_from: intent === "paid" ? me : otherId,
      p_to: intent === "paid" ? otherId : me,
      p_amount_cents: amountCents,
      p_settled_on: /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : undefined,
    });
  } else {
    const paymentId = id(formData, "paymentId");
    if (!paymentId) return { status: "error", error: "generic" };
    if (intent === "confirm") result = await supabase.rpc("confirm_payment", { p_settlement: paymentId });
    else if (intent === "reject") result = await supabase.rpc("reject_payment", { p_settlement: paymentId });
    else if (intent === "cancel") result = await supabase.rpc("cancel_payment", { p_settlement: paymentId });
    else return { status: "error", error: "generic" };
  }

  if (result.error) return { status: "error", error: toExpensesErrorKey(result.error) };
  return redirect({ href: `/hogar/${householdId}/gastos`, locale });
}

// ─── Gastos fijos ───

// Crear o editar un gasto fijo (si llega recurringId, se edita)
export async function saveRecurring(_prevState: RecurringFormState, formData: FormData): Promise<RecurringFormState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const recurringId = text(formData, "recurringId") ? id(formData, "recurringId") : null;
  if (!householdId || (text(formData, "recurringId") && !recurringId)) return { status: "error", formError: "generic" };

  // Hoy en la zona horaria del hogar (la manda la página). Al editar con cargos ya apuntados,
  // el primer cargo no cambia y no se vuelve a comprobar.
  const today = text(formData, "today");
  const keepStart = text(formData, "keepStart") || undefined;
  const built = buildRecurring(
    {
      description: text(formData, "description"),
      amount: text(formData, "amount"),
      frequency: text(formData, "frequency"),
      interval: text(formData, "interval"),
      startsOn: text(formData, "startsOn"),
      paidBy: text(formData, "paidBy"),
      splitMethod: text(formData, "splitMethod"),
      participants: json(text(formData, "participants")),
    },
    /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : undefined,
    keepStart,
  );
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };

  const v = built.value;
  const args = {
    p_description: v.description,
    p_amount_cents: v.amountCents,
    p_frequency: v.frequency,
    p_interval: v.interval,
    p_starts_on: v.startsOn,
    p_paid_by: v.paidBy,
    p_split_method: v.splitMethod,
    p_shares: v.shares,
  };
  const supabase = await createClient();
  const { error } = recurringId
    ? await supabase.rpc("update_recurring_expense", { p_recurring: recurringId, p_version: version(formData), ...args })
    : await supabase.rpc("create_recurring_expense", { p_household: householdId, ...args });
  if (error) {
    const key = toExpensesErrorKey(error);
    return key === "startInvalid" || key === "scheduleLocked"
      ? { status: "error", fieldErrors: { startsOn: key } }
      : { status: "error", formError: key };
  }

  return redirect({ href: `/hogar/${householdId}/gastos/fijos`, locale });
}

// Confirmar, rechazar, pausar, reanudar o borrar un gasto fijo
export async function recurringAction(_prevState: ExpensesActionState, formData: FormData): Promise<ExpensesActionState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const recurringId = id(formData, "recurringId");
  const intent = text(formData, "intent");
  if (!householdId || !recurringId) return { status: "error", error: "generic" };

  const supabase = await createClient();
  let result: { error: { message?: string; code?: string } | null };
  const p_version = version(formData);
  if (intent === "confirm") result = await supabase.rpc("confirm_recurring_expense", { p_recurring: recurringId, p_version });
  else if (intent === "reject") {
    const reason = text(formData, "reason").trim().slice(0, 200);
    result = await supabase.rpc("reject_recurring_expense", { p_recurring: recurringId, p_version, p_reason: reason || undefined });
  } else if (intent === "pause" || intent === "resume") {
    result = await supabase.rpc("set_recurring_expense_active", { p_recurring: recurringId, p_active: intent === "resume" });
  } else if (intent === "delete") result = await supabase.rpc("delete_recurring_expense", { p_recurring: recurringId, p_version });
  else return { status: "error", error: "generic" };

  if (result.error) return { status: "error", error: toExpensesErrorKey(result.error) };
  // Desde "Te toca a ti" se vuelve a la pantalla de gastos; si no, a la de gastos fijos
  const back = text(formData, "returnTo") === "overview" ? `/hogar/${householdId}/gastos` : `/hogar/${householdId}/gastos/fijos`;
  return redirect({ href: back, locale });
}
