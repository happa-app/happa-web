// Historial de gastos: lo más reciente arriba. Cada gasto lleva a su detalle.
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDay, myEffect, participantsOf } from "../format";
import { formatMoney } from "../money";
import type { Expense } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  expenses: Expense[];
  names: Map<string, string>;
};

export function ExpenseList({ householdId, currentUserId, expenses, names }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const name = (id: string) => names.get(id) ?? t("someone");

  // Cómo te afecta cada gasto (los pendientes y rechazados aún no cuentan en los saldos)
  function mineText(e: Expense): string {
    const mine = myEffect(e, currentUserId);
    if (!mine.involved) return t("expenses.notInvolved");
    if (e.status === "pending") return t("expenses.notYet");
    if (e.status === "rejected") return t("expenses.notCounted");
    if (mine.netCents > 0) return t("expenses.youLent", { amount: formatMoney(mine.netCents, locale) });
    if (mine.netCents < 0) return t("expenses.youOwe", { amount: formatMoney(-mine.netCents, locale) });
    return t("expenses.youEven");
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("expenses.title")}</h2>
      {expenses.length === 0 ? (
        <p className={styles.empty}>{t("expenses.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {expenses.map((e) => {
            const payers =
              e.payers.length > 1
                ? t("expenses.paidByMany", { count: e.payers.length })
                : e.payers[0]?.userId === currentUserId
                  ? t("expenses.paidByYou")
                  : t("expenses.paidBy", { name: name(e.payers[0]?.userId ?? "") });
            const confirmed = participantsOf(e).filter((id) => e.confirmedBy.includes(id)).length;
            return (
              <li key={e.id}>
                <Link href={`/hogar/${householdId}/gastos/${e.id}`} className={styles.expenseRow}>
                  <span className={styles.date}>{formatDay(e.spentOn, locale)}</span>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{e.description}</span>
                    <span className={styles.rowMeta}>
                      {payers}
                      {e.status === "pending" ? (
                        <span className={styles.chipPending}>
                          {t("status.pending", { done: confirmed, total: participantsOf(e).length })}
                        </span>
                      ) : null}
                      {e.status === "rejected" ? <span className={styles.chipRejected}>{t("status.rejected")}</span> : null}
                      {e.source === "shopping" ? <span className={styles.chipSource}>{t("expenses.sourceShopping")}</span> : null}
                      {e.source === "recurring" ? <span className={styles.chipSource}>{t("expenses.sourceRecurring")}</span> : null}
                    </span>
                  </span>
                  <span className={styles.rowRight}>
                    <span className={styles.rowAmount}>{formatMoney(e.amountCents, locale)}</span>
                    <span className={styles.rowMine}>{mineText(e)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
