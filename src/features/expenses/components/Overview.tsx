// Piezas de la pantalla de gastos que solo enseñan datos: tu saldo, los saldos de todos y los pagos.
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { formatDay } from "../format";
import { formatMoney } from "../money";
import { netBars } from "../settle";
import type { Payment, BalancePerson } from "../types";
import styles from "./Expenses.module.css";

// "+12,00 €" en verde, "−12,00 €" en ámbar, "0,00 €" en gris
export function SignedAmount({ cents, className }: { cents: number; className?: string }) {
  const locale = useLocale();
  const tone = cents > 0 ? styles.owed : cents < 0 ? styles.owe : styles.even;
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return <span className={`${tone} ${className ?? ""}`}>{sign + formatMoney(Math.abs(cents), locale)}</span>;
}

// Tu saldo en una frase grande (igual que en Inicio) y, a la derecha, cuántas cosas esperan que las confirmes
export function MyBalance({
  netCents,
  everyoneEven,
  toConfirm,
}: {
  netCents: number;
  // Nadie del hogar debe nada: "Estáis en paz"; si solo tú estás a cero, "Estás en paz"
  everyoneEven: boolean;
  toConfirm: number;
}) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const amount = formatMoney(Math.abs(netCents), locale);
  return (
    <div className={styles.homeBalance}>
      <p className={netCents > 0 ? styles.homeOwed : netCents < 0 ? styles.homeOwe : styles.homeEven}>
        {netCents > 0
          ? t("tile.owed", { amount })
          : netCents < 0
            ? t("tile.owe", { amount })
            : everyoneEven
              ? t("tile.even")
              : t("home.youEven")}
      </p>
      {toConfirm > 0 ? <span className={styles.homeBadge}>{t("tile.toConfirm", { count: toConfirm })}</span> : null}
    </div>
  );
}

// La balanza de todo el piso: una barra por persona, a la derecha si le deben y a la izquierda si debe
export function BalanceList({ people, currentUserId }: { people: BalancePerson[]; currentUserId: string }) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const bars = netBars(people);
  return (
    <Section title={t("balances.title")}>
      <ul className={styles.balance}>
        {people.map((p, i) => {
          const bar = bars[i];
          const name = p.userId === currentUserId ? t("youCap") : p.name;
          const money = formatMoney(Math.abs(p.netCents), locale);
          return (
            <li key={p.userId} className={styles.balanceRow}>
              <span className="visually-hidden">
                {p.netCents > 0
                  ? t("balance.owedSr", { name, amount: money })
                  : p.netCents < 0
                    ? t("balance.oweSr", { name, amount: money })
                    : t("balance.evenSr", { name })}
                {!p.isCurrent ? `. ${t("balances.left")}` : ""}
              </span>
              <span className={`${styles.balanceName} ${p.isCurrent ? "" : styles.muted}`} aria-hidden="true">
                {name}
              </span>
              {/* Dos mitades: a la izquierda lo que debe, a la derecha lo que le deben */}
              <span className={styles.balanceHalfLeft} aria-hidden="true">
                {bar.netCents < 0 ? <span className={styles.barOwe} style={{ width: `${bar.widthPct}%` }} /> : null}
              </span>
              <span className={styles.balanceHalfRight} aria-hidden="true">
                {bar.netCents > 0 ? <span className={styles.barOwed} style={{ width: `${bar.widthPct}%` }} /> : null}
              </span>
              <span aria-hidden="true">
                <SignedAmount cents={p.netCents} className={styles.balanceAmount} />
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function PaymentList({ payments, names }: { payments: Payment[]; names: Map<string, string> }) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  if (payments.length === 0) return null;
  return (
    <ul className={styles.list}>
      {payments.map((p) => (
        <li key={p.id} className={styles.row}>
          <span className={styles.date}>{formatDay(p.settledOn, locale)}</span>
          <span className={styles.rowMain}>
            <span className={styles.rowTitle}>
              {t("payments.paid", { from: names.get(p.fromUser) ?? t("someone"), to: names.get(p.toUser) ?? t("someone") })}
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
  );
}
