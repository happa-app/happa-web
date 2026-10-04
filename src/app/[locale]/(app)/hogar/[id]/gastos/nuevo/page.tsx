// Página /hogar/<id>/gastos/nuevo: añadir un gasto (solo quien vive en el hogar).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseForm, todayIn, uuidSchema } from "@/features/expenses";
import { getExpensesContext, getBalances } from "@/features/expenses/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewExpensePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const context = await getExpensesContext(id);
  if (!context?.isCurrent) notFound();

  // En un gasto nuevo solo pueden estar los adultos que viven ahora en el hogar
  const adults = (await getBalances(id)).filter((p) => p.isCurrent);

  return (
    <>
      <Link href={`/hogar/${id}/gastos`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("form.newTitle")}</h1>
      </section>
      <ExpenseForm
        householdId={id}
        currentUserId={userId}
        people={adults.map((p) => ({ userId: p.userId, name: p.name }))}
        today={todayIn(context.timezone)}
      />
    </>
  );
}
