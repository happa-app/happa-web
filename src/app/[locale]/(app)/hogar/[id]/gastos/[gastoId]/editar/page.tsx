// Página /hogar/<id>/gastos/<gasto>/editar. Sin confirmar: quien lo creó (si sigue en el hogar)
// o un admin. Confirmado: solo un admin. La base de datos lo vuelve a comprobar al guardar.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseForm, todayIn, uuidSchema } from "@/features/expenses";
import { getExpense, getExpensesContext } from "@/features/expenses/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; gastoId: string }>;
};

export default async function EditExpensePage({ params }: Props) {
  const { id, gastoId } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const locale = await getLocale();
  if (!userId) {
    return redirect({ href: "/login", locale });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(gastoId).success) notFound();
  const context = await getExpensesContext(id);
  if (!context) notFound();

  const result = await getExpense(id, gastoId);
  if (!result) notFound();
  const { expense, people } = result;

  const canEdit =
    context.isAdmin || (context.isCurrent && expense.status !== "confirmed" && expense.createdBy === userId);
  if (!canEdit) {
    return redirect({ href: `/hogar/${id}/gastos/${expense.id}`, locale });
  }

  // Adultos actuales y, además, quien ya estaba en el gasto (aunque se haya ido del hogar)
  const inExpense = new Set([...expense.payers.map((p) => p.userId), ...expense.shares.map((s) => s.userId)]);
  const selectable = people
    .filter((p) => p.isCurrent || inExpense.has(p.userId))
    .map((p) => ({ userId: p.userId, name: p.name }));

  return (
    <>
      <Link href={`/hogar/${id}/gastos/${expense.id}`} className={styles.back}>
        ← {expense.description}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("form.editTitle")}</h1>
        <p className={styles.subtitle}>
          {expense.status === "confirmed" ? t("form.editConfirmedHint") : t("form.editPendingHint")}
        </p>
      </section>
      <ExpenseForm
        householdId={id}
        currentUserId={userId}
        people={selectable}
        today={todayIn(context.timezone)}
        expense={expense}
      />
    </>
  );
}
