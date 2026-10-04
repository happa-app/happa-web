// Piezas de la pantalla de gastos que solo enseñan datos: tu saldo, los saldos de todos y los pagos.
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { formatDay } from "../format";
import { formatMoney } from "../money";
import type { Payment, BalancePerson } from "../types";
import styles from "./Expenses.module.css";

// "+12,00 €" en verde, "−12,00 €" en ámbar, "0,00 €" en gris
export function SignedAmount({ cents, className }: { cents: number; className?: string }) {
  const locale = useLocale();
  const tone = cents > 0 ? styles.owed : cents < 0 ? styles.owe : styles.even;
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return <span className={`${tone} ${className ?? ""}`}>{sign + formatMoney(Math.abs(cents), locale)}</span>;
}

export function MyBalance({ netCents }: { netCents: number }) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const tone = netCents > 0 ? styles.balanceOwed : netCents < 0 ? styles.balanceOwe : styles.balanceEven;
  return (
    <section className={`${styles.balanceCard} ${tone}`} aria-label={t("balance.title")}>
      <p className={styles.balanceLabel}>{t("balance.title")}</p>
      <p className={styles.balanceAmount}>{formatMoney(Math.abs(netCents), locale)}</p>
      <p className={styles.balanceText}>
        {netCents > 0 ? t("balance.owed") : netCents < 0 ? t("balance.owe") : t("balance.even")}
      </p>
    </section>
  );
}

export function BalanceList({ people, currentUserId }: { people: BalancePerson[]; currentUserId: string }) {
  const t = useTranslations("Expenses");
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("balances.title")}</h2>
      <ul className={styles.list}>
        {people.map((p) => (
          <li key={p.userId} className={styles.row}>
            <Avatar name={p.name} size="sm" />
            <span className={styles.rowMain}>
              <span className={styles.rowTitle}>
                {p.name}
                {p.userId === currentUserId ? <span className={styles.muted}> ({t("you")})</span> : null}
              </span>
              {!p.isCurrent ? <span className={styles.rowMeta}>{t("balances.left")}</span> : null}
            </span>
            <SignedAmount cents={p.netCents} className={styles.rowAmount} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PaymentList({ payments, names }: { payments: Payment[]; names: Map<string, string> }) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  if (payments.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("payments.title")}</h2>
      <ul className={styles.list}>
        {payments.map((p) => (
          <li key={p.id} className={styles.row}>
            <span className={styles.date}>{formatDay(p.settledOn, locale)}</span>
            <span className={styles.rowMain}>
              <span className={styles.rowTitle}>
                {t("payments.line", { from: names.get(p.fromUser) ?? t("someone"), to: names.get(p.toUser) ?? t("someone") })}
              </span>
              {p.status === "pending" ? <span className={styles.chipPending}>{t("status.pendingPayment")}</span> : null}
              {p.status === "rejected" ? <span className={styles.chipRejected}>{t("status.rejectedPayment")}</span> : null}
            </span>
            <span className={p.status === "rejected" ? styles.rowAmountStruck : styles.rowAmount}>
              {formatMoney(p.amountCents, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
