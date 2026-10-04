// "Te toca a ti": gastos y gastos fijos que esperan tu confirmación, pagos que dicen haberte hecho
// y tus pagos que aún no te han confirmado.
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { myEffect, recurringShareOf, recurringWaitingForMe, waitingForMe } from "../format";
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
  if (toConfirm.length + paymentsToMe.length + myPendingPayments.length + recurringToConfirm.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("pending.title")}</h2>
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
                fields={{ householdId, paymentId: p.id, intent: "confirm" }}
                label={t("pending.confirmPayment")}
              />
              <ActionButton
                kind="payment"
                fields={{ householdId, paymentId: p.id, intent: "reject" }}
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
                label={t("pending.cancelPayment")}
                confirmText={t("pending.cancelPaymentConfirm")}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
