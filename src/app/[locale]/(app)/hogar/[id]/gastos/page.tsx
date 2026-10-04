// Página /hogar/<id>/gastos: tu saldo, lo que te toca confirmar, el ajuste para quedar en paz,
// los gastos fijos, los saldos de todos y el historial. Para adultos del hogar y para quien se fue
// con saldo pendiente.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  BalanceList,
  ExpenseList,
  MyBalance,
  nameMap,
  PaymentList,
  PendingForMe,
  RecurringTile,
  SettleUp,
  todayIn,
  uuidSchema,
} from "@/features/expenses";
import { getExpensesContext, getExpensesOverview } from "@/features/expenses/server";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExpensesPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  // null: no eres adulto del hogar ni te fuiste con saldo pendiente (menores y casero tampoco)
  const context = await getExpensesContext(id);
  if (!context) notFound();

  // (Se ponen al día los gastos fijos antes de leer)
  const [{ people, expenses, payments, recurring }, shoppingItems] = await Promise.all([
    getExpensesOverview(id),
    // Para ofrecer pasar lo comprado a gastos (solo a quien vive aquí)
    context.isCurrent ? getHouseholdShoppingItems(id) : [],
  ]);
  const boughtCount = shoppingItems.filter((i) => i.checkedAt).length;
  const names = nameMap(people);
  const myNet = people.find((p) => p.userId === userId)?.netCents ?? 0;

  return (
    <>
      <Link href={context.isCurrent ? `/hogar/${id}` : "/inicio"} className={styles.back}>
        ← {context.name}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>

      {!context.isCurrent ? <Alert tone="success">{t("leftBanner")}</Alert> : null}

      <MyBalance netCents={myNet} />
      {context.isCurrent ? (
        <ButtonLink href={`/hogar/${id}/gastos/nuevo`} fullWidth>
          {t("addExpense")}
        </ButtonLink>
      ) : null}
      {context.isCurrent && boughtCount > 0 ? (
        <Link href={`/hogar/${id}/gastos/compra`} className={styles.inlineLink}>
          {t("fromShopping.link", { count: boughtCount })}
        </Link>
      ) : null}

      <PendingForMe
        householdId={id}
        currentUserId={userId}
        expenses={expenses}
        payments={payments}
        recurring={context.isCurrent ? recurring : []}
        names={names}
      />
      <SettleUp
        householdId={id}
        currentUserId={userId}
        people={people}
        payments={payments}
        names={names}
        today={todayIn(context.timezone)}
      />
      {context.isCurrent ? (
        <RecurringTile
          href={`/hogar/${id}/gastos/fijos`}
          recurring={recurring}
          currentUserId={userId}
          currentIds={new Set(people.filter((p) => p.isCurrent).map((p) => p.userId))}
        />
      ) : null}
      <BalanceList people={people} currentUserId={userId} />
      <ExpenseList householdId={id} currentUserId={userId} expenses={expenses} names={names} />
      <PaymentList payments={payments} names={names} />
    </>
  );
}
