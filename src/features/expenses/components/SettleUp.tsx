// "Para quedar en paz": el ajuste automático. Propone quién paga a quién; si te toca, puedes
// apuntar el pago desde aquí ("He pagado" o "Me ha pagado").
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
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

  // Si nadie debe nada no hay nada que saldar: la sección no sale
  if (transfers.length === 0) return null;

  return (
    <Section title={t("settle.title")}>
      <ul className={styles.list}>
        {transfers.map((tr) => {
          const amount = formatMoney(tr.amountCents, locale);
          const waiting = payments.some((p) => p.status === "pending" && p.fromUser === tr.from && p.toUser === tr.to);
          return (
            <li key={`${tr.from}-${tr.to}`} className={styles.pendingItem}>
              <p className={styles.transfer}>
                {tr.from === currentUserId
                  ? t("home.youOwe", { amount, name: name(tr.to) })
                  : tr.to === currentUserId
                    ? t("home.owesYou", { amount, name: name(tr.from) })
                    : `${name(tr.from)} → ${name(tr.to)} · ${amount}`}
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
    </Section>
  );
}
