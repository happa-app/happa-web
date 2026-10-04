// Página /hogar/<id>/gastos/fijos: suscripciones y gastos que se repiten. Se confirman una vez y
// luego se apuntan solos cada vez que toca.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { nameMap, RecurringList, todayIn, uuidSchema } from "@/features/expenses";
import {
  getBalances,
  getExpensesContext,
  getRecurringExpenses,
  syncRecurringExpenses,
} from "@/features/expenses/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecurringExpensesPage({ params }: Props) {
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
  if (!context) notFound();

  // Primero se apunta lo que toque, para que "próximo cargo" esté al día
  await syncRecurringExpenses(id);
  const [people, recurring] = await Promise.all([getBalances(id), getRecurringExpenses(id)]);
  const currentIds = new Set(people.filter((p) => p.isCurrent).map((p) => p.userId));

  return (
    <>
      <Link href={`/hogar/${id}/gastos`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("recurring.title")}</h1>
        <p className={styles.subtitle}>{t("recurring.subtitle")}</p>
      </section>
      {context.isCurrent ? (
        <ButtonLink href={`/hogar/${id}/gastos/fijos/nuevo`} fullWidth>
          {t("recurring.add")}
        </ButtonLink>
      ) : null}
      <RecurringList
        householdId={id}
        recurring={recurring}
        names={nameMap(people)}
        currentUserId={userId}
        currentIds={currentIds}
        isCurrent={context.isCurrent}
        isAdmin={context.isAdmin}
        today={todayIn(context.timezone)}
      />
    </>
  );
}
