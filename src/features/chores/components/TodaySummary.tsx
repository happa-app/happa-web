// Arriba de la página de tareas: cuántas te tocan hoy y si tienes algo atrasado o por dar el visto bueno.
import { useTranslations } from "next-intl";
import type { ChoresSummary } from "../types";
import styles from "./Chores.module.css";

export function TodaySummary({ summary }: { summary: ChoresSummary }) {
  const t = useTranslations("Chores");
  const extra = [
    summary.myOverdue > 0 ? t("summary.overdue", { count: summary.myOverdue }) : null,
    summary.toApprove > 0 ? t("summary.toApprove", { count: summary.toApprove }) : null,
  ].filter(Boolean);

  return (
    <div className={`${styles.card} ${styles.summary}`}>
      <span className={styles.summaryNumber} aria-hidden="true">
        {summary.myToday}
      </span>
      <div className={styles.summaryText}>
        <p className={styles.summaryTitle}>{t("summary.today", { count: summary.myToday })}</p>
        <p className={styles.muted}>{extra.length > 0 ? extra.join(" · ") : t("summary.allGood")}</p>
      </div>
    </div>
  );
}
