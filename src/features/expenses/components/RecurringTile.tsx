// "Fijos" en la pantalla de gastos: hasta 3 gastos fijos (qué es, cada cuánto, el próximo cargo y el importe)
// y el enlace a la lista entera. Si no hay ninguno, una fila que lleva a crear el primero.
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { formatDay } from "../format";
import { formatMoney } from "../money";
import type { RecurringExpense } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  recurring: RecurringExpense[];
};

const SHOWN = 3;

export function RecurringTile({ householdId, recurring }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const base = `/hogar/${householdId}/gastos/fijos`;

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
        {recurring.slice(0, SHOWN).map((r) => (
          <li key={r.id} className={styles.row}>
            <span className={styles.rowMain}>
              <span className={styles.rowTitle}>{r.description}</span>
              <span className={styles.rowMeta}>
                {t("recurring.schedule", { frequency: r.frequency, interval: r.interval })} ·{" "}
                {t("recurring.next", { date: formatDay(r.nextChargeOn, locale) })}
              </span>
            </span>
            <span className={styles.rowAmount}>{formatMoney(r.amountCents, locale)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
