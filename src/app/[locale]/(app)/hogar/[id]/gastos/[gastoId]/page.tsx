// Página /hogar/<id>/gastos/<gasto>: detalle de un gasto y lo que puedes hacer con él.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseDetail, nameMap, uuidSchema } from "@/features/expenses";
import { getExpense, getExpensesContext } from "@/features/expenses/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; gastoId: string }>;
};

export default async function ExpensePage({ params }: Props) {
  const { id, gastoId } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(gastoId).success) notFound();
  const context = await getExpensesContext(id);
  if (!context) notFound();

  const result = await getExpense(id, gastoId);
  if (!result) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/gastos`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{result.expense.description}</h1>
      </section>
      <ExpenseDetail
        householdId={id}
        expense={result.expense}
        names={nameMap(result.people)}
        currentUserId={userId}
        isCurrent={context.isCurrent}
        isAdmin={context.isAdmin}
      />
    </>
  );
}
