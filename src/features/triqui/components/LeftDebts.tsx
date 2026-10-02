// Aviso en Inicio: hogares que dejaste donde aún tienes saldo pendiente, con enlace a su triqui.
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "../money";
import type { LeftDebt } from "../types";
import styles from "./Triqui.module.css";

export function LeftDebts({ debts }: { debts: LeftDebt[] }) {
  const t = useTranslations("Triqui");
  const locale = useLocale();
  if (debts.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("leftDebts.title")}</h2>
      <ul className={styles.list}>
        {debts.map((d) => {
          const amount = formatMoney(Math.abs(d.netCents), locale);
          return (
            <li key={d.householdId}>
              <Link href={`/hogar/${d.householdId}/triqui`} className={styles.expenseRow}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{d.name}</span>
                </span>
                <span className={d.netCents < 0 ? styles.owe : styles.owed}>
                  {d.netCents < 0 ? t("leftDebts.owe", { amount }) : t("leftDebts.owed", { amount })}
                </span>
                <span className={styles.tileChevron} aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
