// Sección "Por confirmar" de Gastos: gastos y gastos fijos que esperan tu confirmación, pagos que dicen
// haberte hecho y tus pagos que aún no te han confirmado. Su dato (`meta`) es el mismo número que el
// aviso junto al saldo (`forMe`); tus pagos pendientes se listan, pero no cuentan en él.
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { myEffect, pendingCounts, recurringShareOf, recurringWaitingForMe, waitingForMe } from "../format";
import { formatMoney } from "../money";
import type { Expense, Payment, RecurringExpense } from "../types";
import { ActionButton } from "./ActionButton";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  expenses: Expense[];
  payments: Payment[];
  recurring?: RecurringExpense[];
  names: Map<string, string>;
};

export function PendingForMe({ householdId, currentUserId, expenses, payments, recurring = [], names }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const name = (id: string | null) => (id ? names.get(id) : undefined) ?? t("someone");

  const toConfirm = expenses.filter((e) => waitingForMe(e, currentUserId));
  const paymentsToMe = payments.filter((p) => p.status === "pending" && p.toUser === currentUserId);
  const myPendingPayments = payments.filter((p) => p.status === "pending" && p.fromUser === currentUserId);
  const recurringToConfirm = recurring.filter((r) => recurringWaitingForMe(r, currentUserId));
  const { forMe, total } = pendingCounts(expenses, payments, recurring, currentUserId);
  if (total === 0) return null;

  return (
    <Section title={t("pending.title")} meta={forMe > 0 ? String(forMe) : undefined}>
      <ul className={styles.list}>
        {toConfirm.map((e) => {
          const { shareCents } = myEffect(e, currentUserId);
          return (
            <li key={e.id} className={styles.pendingItem}>
              <p className={styles.rowTitle}>{t("pending.expense", { name: name(e.createdBy), description: e.description })}</p>
              <p className={styles.rowMeta}>
                {t("pending.expenseMeta", { amount: formatMoney(e.amountCents, locale), share: formatMoney(shareCents, locale) })}
              </p>
              <div className={styles.buttonRow}>
                <ActionButton
                  kind="expense"
                  variant="primary"
                size="sm"
                  fields={{ householdId, expenseId: e.id, version: String(e.version), intent: "confirm", returnTo: "list" }}
                  label={t("pending.confirm")}
                />
                <Link href={`/hogar/${householdId}/gastos/${e.id}`} className={styles.textLink}>
                  {t("pending.review")}
                </Link>
              </div>
            </li>
          );
        })}

        {recurringToConfirm.map((r) => (
          <li key={r.id} className={styles.pendingItem}>
            <p className={styles.rowTitle}>
              {t("recurring.pendingForMe", { name: name(r.createdBy), description: r.description })}
            </p>
            <p className={styles.rowMeta}>
              {t("recurring.pendingForMeMeta", {
                amount: formatMoney(r.amountCents, locale),
                every: t("recurring.everyText", { frequency: r.frequency, interval: r.interval }),
                share: formatMoney(recurringShareOf(r, currentUserId), locale),
              })}
            </p>
            <div className={styles.buttonRow}>
              <ActionButton
                kind="recurring"
                variant="primary"
                size="sm"
                fields={{ householdId, recurringId: r.id, version: String(r.version), intent: "confirm", returnTo: "overview" }}
                label={t("pending.confirm")}
              />
              <Link href={`/hogar/${householdId}/gastos/fijos`} className={styles.textLink}>
                {t("pending.review")}
              </Link>
            </div>
          </li>
        ))}

        {paymentsToMe.map((p) => (
          <li key={p.id} className={styles.pendingItem}>
            <p className={styles.rowTitle}>
              {t("pending.paymentToMe", { name: name(p.fromUser), amount: formatMoney(p.amountCents, locale) })}
            </p>
            <div className={styles.buttonRow}>
              <ActionButton
                kind="payment"
                variant="primary"
                size="sm"
                fields={{ householdId, paymentId: p.id, intent: "confirm" }}
                label={t("pending.confirmPayment")}
              />
              <ActionButton
                kind="payment"
                fields={{ householdId, paymentId: p.id, intent: "reject" }}
                size="sm"
                label={t("pending.rejectPayment")}
                confirmText={t("pending.rejectPaymentConfirm", { name: name(p.fromUser) })}
              />
            </div>
          </li>
        ))}

        {myPendingPayments.map((p) => (
          <li key={p.id} className={styles.pendingItem}>
            <p className={styles.rowTitle}>
              {t("pending.myPayment", { name: name(p.toUser), amount: formatMoney(p.amountCents, locale) })}
            </p>
            <p className={styles.rowMeta}>{t("pending.myPaymentMeta", { name: name(p.toUser) })}</p>
            <div className={styles.buttonRow}>
              <ActionButton
                kind="payment"
                fields={{ householdId, paymentId: p.id, intent: "cancel" }}
                size="sm"
                label={t("pending.cancelPayment")}
                confirmText={t("pending.cancelPaymentConfirm")}
              />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
