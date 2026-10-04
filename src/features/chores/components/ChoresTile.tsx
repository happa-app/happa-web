// Acceso a las tareas desde la página del hogar: cuántas te tocan hoy.
import { useTranslations } from "next-intl";
import { BroomIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import type { ChoresSummary } from "../types";
import styles from "./Chores.module.css";

type Props = { href: string; summary: ChoresSummary };

export function ChoresTile({ href, summary }: Props) {
  const t = useTranslations("Chores");
  const alerts = [
    summary.myOverdue > 0 ? t("summary.overdue", { count: summary.myOverdue }) : null,
    summary.toApprove > 0 ? t("summary.toApprove", { count: summary.toApprove }) : null,
  ].filter(Boolean);

  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.tileIcon}>
        <BroomIcon />
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{t("title")}</span>
        <span className={styles.muted}>
          {summary.choreCount === 0 ? t("tile.empty") : t("summary.today", { count: summary.myToday })}
        </span>
        {alerts.length > 0 ? <span className={styles.tileAlert}>{alerts.join(" · ")}</span> : null}
      </span>
      <span className={styles.tileChevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
