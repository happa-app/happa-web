// Una fila de la lista de tareas: el botón de "hecha", qué es, a quién le toca, cómo va y lo que puedes hacer.
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { formatDay } from "../format";
import { canApprove, canComplete, canReopen, canTake, isOverdue } from "../logic";
import type { Chore, ChoreDay } from "../types";
import { ChoreActionButton, CheckMark } from "./ChoreActionButton";
import { EffortDots } from "./EffortDots";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  day: ChoreDay;
  chore: Chore;
  // userId → nombre (quienes viven aquí)
  names: Record<string, string>;
  me: string;
  isAdult: boolean;
  today: string;
  // Enseñar también qué día era (en atrasadas y en las que esperan el visto bueno)
  showDate?: boolean;
};

export function ChoreDayRow({ householdId, day, chore, names, me, isAdult, today, showDate = false }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const nameOf = (userId: string | null) =>
    userId === null ? t("free") : userId === me ? t("youCap") : (names[userId] ?? t("someone"));
  const fields = { householdId, dayId: day.id };
  const isMine = day.assigneeId === me;
  const done = day.status === "done";

  const who =
    day.assigneeId === null ? (
      <span className={styles.pill}>{t("free")}</span>
    ) : (
      <span>{nameOf(day.assigneeId)}</span>
    );

  let status = null;
  if (isOverdue(day, today)) status = <span className={styles.pillOverdue}>{t("row.overdue")}</span>;
  else if (day.status === "review") status = <span className={styles.pillReview}>{t("row.review")}</span>;
  else if (done) {
    status = (
      <span className={styles.pillDone}>
        {day.doneBy && day.doneBy !== day.assigneeId ? t("row.doneBy", { name: nameOf(day.doneBy) }) : t("row.done")}
      </span>
    );
  }
  const reopened =
    day.status === "pending" && day.reopenedBy && day.reopenedBy !== me ? (
      <span className={styles.pillOverdue}>{t("row.reopenedBy", { name: nameOf(day.reopenedBy) })}</span>
    ) : null;

  const actions: ReactNode[] = [];
  if (canTake(day)) {
    actions.push(<ChoreActionButton key="take" fields={{ ...fields, intent: "take" }} label={t("row.take")} />);
  }
  if (canApprove(day, isAdult)) {
    actions.push(<ChoreActionButton key="approve" fields={{ ...fields, intent: "approve" }} label={t("row.approve")} />);
  }
  if (canReopen(day, me, isAdult)) {
    actions.push(
      <ChoreActionButton
        key="reopen"
        fields={{ ...fields, intent: "reopen" }}
        label={t("row.reopen")}
        confirmText={day.doneBy === me ? undefined : t("row.reopenConfirm", { title: chore.title })}
      />,
    );
  }

  return (
    <li className={isMine && !done ? `${styles.row} ${styles.rowMine}` : styles.row}>
      {canComplete(day, me, isAdult) ? (
        <ChoreActionButton
          look="check"
          fields={{ ...fields, intent: "complete" }}
          label={t("row.complete", { title: chore.title })}
        />
      ) : (
        <span
          className={`${styles.check} ${done ? styles.checkDone : day.status === "review" ? styles.checkReview : styles.checkLocked}`}
          aria-hidden="true"
        >
          <span className={styles.checkCircle}>{day.status === "pending" ? null : <CheckMark />}</span>
        </span>
      )}

      <div className={styles.rowBody}>
        <div className={styles.rowTitleLine}>
          <Link
            href={`/hogar/${householdId}/tareas/dia/${day.id}`}
            className={done ? `${styles.rowTitle} ${styles.rowTitleDone}` : styles.rowTitle}
          >
            {chore.title}
          </Link>
          <EffortDots effort={chore.effort} />
        </div>
        <p className={styles.rowMeta}>
          {who}
          {showDate ? <span>· {formatDay(day.dueOn, locale)}</span> : null}
          {status}
          {reopened}
        </p>
        {actions.length > 0 ? <div className={styles.rowActions}>{actions}</div> : null}
      </div>
    </li>
  );
}
