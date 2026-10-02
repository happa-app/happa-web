// Página /hogar/<id>/triqui: tu saldo, lo que te toca confirmar, el ajuste para quedar en paz,
// los saldos de todos y los gastos. Para adultos del hogar y para quien se fue con saldo pendiente.
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
  SettleUp,
  todayIn,
  uuidSchema,
} from "@/features/triqui";
import { getTriquiContext, getTriquiOverview } from "@/features/triqui/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TriquiPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Triqui");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  // null: no eres adulto del hogar ni te fuiste con saldo pendiente (menores y casero tampoco)
  const context = await getTriquiContext(id);
  if (!context) notFound();

  const { people, expenses, payments } = await getTriquiOverview(id);
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
        <ButtonLink href={`/hogar/${id}/triqui/nuevo`} fullWidth>
          {t("addExpense")}
        </ButtonLink>
      ) : null}

      <PendingForMe householdId={id} currentUserId={userId} expenses={expenses} payments={payments} names={names} />
      <SettleUp
        householdId={id}
        currentUserId={userId}
        people={people}
        payments={payments}
        names={names}
        today={todayIn(context.timezone)}
      />
      <BalanceList people={people} currentUserId={userId} />
      <ExpenseList householdId={id} currentUserId={userId} expenses={expenses} names={names} />
      <PaymentList payments={payments} names={names} />
    </>
  );
}
