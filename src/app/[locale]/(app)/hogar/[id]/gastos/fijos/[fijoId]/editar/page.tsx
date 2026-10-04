// Página /hogar/<id>/gastos/fijos/<fijo>/editar. Sin confirmar: quien lo creó (si sigue en el hogar)
// o un admin. Confirmado: solo un admin. La base de datos lo vuelve a comprobar al guardar.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { RecurringForm, todayIn, uuidSchema } from "@/features/expenses";
import { getBalances, getExpensesContext, getRecurringExpense } from "@/features/expenses/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; fijoId: string }>;
};

export default async function EditRecurringPage({ params }: Props) {
  const { id, fijoId } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const locale = await getLocale();
  if (!userId) {
    return redirect({ href: "/login", locale });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(fijoId).success) notFound();
  const context = await getExpensesContext(id);
  if (!context?.isCurrent) notFound();

  const [recurring, people] = await Promise.all([getRecurringExpense(id, fijoId), getBalances(id)]);
  if (!recurring) notFound();

  // Si ya se confirmó alguna vez, solo un admin (como en la base de datos)
  const canEdit = context.isAdmin || (!recurring.everConfirmed && recurring.createdBy === userId);
  if (!canEdit) {
    return redirect({ href: `/hogar/${id}/gastos/fijos`, locale });
  }

  const adults = people.filter((p) => p.isCurrent).map((p) => ({ userId: p.userId, name: p.name }));

  return (
    <>
      <Link href={`/hogar/${id}/gastos/fijos`} className={styles.back}>
        ← {t("recurring.title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("recurring.form.editTitle")}</h1>
        <p className={styles.subtitle}>
          {recurring.everConfirmed
            ? t("recurring.form.editConfirmedHint")
            : t("recurring.form.editPendingHint")}
        </p>
      </section>
      <RecurringForm
        householdId={id}
        currentUserId={userId}
        people={adults}
        today={todayIn(context.timezone)}
        recurring={recurring}
      />
    </>
  );
}
