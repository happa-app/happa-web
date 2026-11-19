// "Fijos" en la pantalla de gastos: hasta 3 gastos fijos (qué es, cada cuánto, el próximo cargo y el importe)
// y el enlace a la lista entera. Si no hay ninguno, una fila que lleva a crear el primero.
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { formatDay, recurringState } from "../format";
import { formatMoney } from "../money";
import type { RecurringExpense } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  recurring: RecurringExpense[];
  // Adultos que viven ahora en el hogar (para saber si el pagador sigue)
  currentIds: Set<string>;
};

const SHOWN = 3;

export function RecurringTile({ householdId, recurring, currentIds }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const base = `/hogar/${householdId}/gastos/fijos`;

  // Primero los activos (sort es estable: dentro de cada grupo se mantiene el orden)
  const ordered = [...recurring].sort((a, b) => Number(b.active) - Number(a.active));

  if (recurring.length === 0) {
    return (
      <Section title={t("recurring.sectionTitle")}>
        <Link href={`${base}/nuevo`} className={styles.emptyLink}>
          {t("home.noRecurring")}
          <span aria-hidden="true">›</span>
        </Link>
      </Section>
    );
  }

  return (
    <Section
      title={t("recurring.sectionTitle")}
      meta={String(recurring.length)}
      link={{ href: base, label: t("recurring.seeAll"), ariaLabel: t("recurring.seeAllAria") }}
    >
      <ul className={styles.list}>
        {ordered.slice(0, SHOWN).map((r) => {
          // Mismo criterio que la lista de fijos: el próximo cargo solo si de verdad se va a cobrar
          const state = recurringState(r, currentIds);
          const status =
            state === "confirmed"
              ? t("recurring.next", { date: formatDay(r.nextChargeOn, locale) })
              : state === "paused"
                ? t("recurring.paused")
                : t(`recurring.tileState.${state}`);
          return (
            <li key={r.id} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{r.description}</span>
                <span className={styles.rowMeta}>
                  {t("recurring.schedule", { frequency: r.frequency, interval: r.interval })} · {status}
                </span>
              </span>
              <span className={styles.rowAmount}>{formatMoney(r.amountCents, locale)}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
