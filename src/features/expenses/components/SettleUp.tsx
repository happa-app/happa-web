// "Para quedar en paz": el ajuste automático. Propone quién paga a quién; si te toca, puedes
// apuntar el pago desde aquí ("He pagado" o "Me ha pagado").
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "../money";
import { suggestTransfers } from "../settle";
import type { Payment, BalancePerson } from "../types";
import { PayForm } from "./PayForm";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  people: BalancePerson[];
  payments: Payment[];
  names: Map<string, string>;
  today: string;
};

export function SettleUp({ householdId, currentUserId, people, payments, names, today }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const name = (id: string) => names.get(id) ?? t("someone");
  const transfers = suggestTransfers(people);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("settle.title")}</h2>
      {transfers.length === 0 ? (
        <p className={styles.empty}>{t("settle.allEven")}</p>
      ) : (
        <ul className={styles.list}>
          {transfers.map((tr) => {
            const waiting = payments.some((p) => p.status === "pending" && p.fromUser === tr.from && p.toUser === tr.to);
            return (
              <li key={`${tr.from}-${tr.to}`} className={styles.pendingItem}>
                <p className={styles.transfer}>
                  <span>
                    {tr.from === currentUserId ? t("youCap") : name(tr.from)} → {tr.to === currentUserId ? t("youObject") : name(tr.to)}
                  </span>
                  <strong>{formatMoney(tr.amountCents, locale)}</strong>
                </p>
                {waiting ? (
                  <p className={styles.rowMeta}>{t("settle.waiting")}</p>
                ) : tr.from === currentUserId ? (
                  <PayForm
                    householdId={householdId}
                    intent="paid"
                    otherUserId={tr.to}
                    otherName={name(tr.to)}
                    defaultCents={tr.amountCents}
                    today={today}
                  />
                ) : tr.to === currentUserId ? (
                  <PayForm
                    householdId={householdId}
                    intent="received"
                    otherUserId={tr.from}
                    otherName={name(tr.from)}
                    defaultCents={tr.amountCents}
                    today={today}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
