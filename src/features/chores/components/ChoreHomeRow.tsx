// Fila compacta de una tarea para Inicio: círculo, título y quién la hace.
// Usa las mismas acciones y los mismos permisos que ChoreDayRow (ChoreActionButton y las funciones can* de logic.ts).
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { dayOffset, formatShortDate } from "../format";
import { canApprove, canComplete, canReopen, canTake, isOverdue } from "../logic";
import type { Chore, ChoreDay } from "../types";
import { ChoreActionButton } from "./ChoreActionButton";
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
};

export function ChoreHomeRow({ householdId, day, chore, names, me, isAdult, today }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const fields = { householdId, dayId: day.id };
  const done = day.status === "done";
  const review = day.status === "review";
  const overdue = isOverdue(day, today);

  const name =
    day.assigneeId === null ? t("free") : day.assigneeId === me ? t("youCap") : (names[day.assigneeId] ?? t("someone"));
  let who = name;
  if (overdue) {
    who =
      dayOffset(day.dueOn, today) === -1
        ? t("home.sinceYesterday", { name })
        : t("home.since", { name, date: formatShortDate(day.dueOn, locale) });
  }

  const actions: ReactNode[] = [];
  if (canTake(day)) {
    actions.push(<ChoreActionButton key="take" fields={{ ...fields, intent: "take" }} label={t("row.take")} />);
  }
  if (canComplete(day, me, isAdult)) {
    actions.push(
      <ChoreActionButton key="complete" fields={{ ...fields, intent: "complete" }} label={t("home.markDone")} />,
    );
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
    <li className={styles.homeRow}>
      <div className={styles.homeRowLine}>
        <span className={done ? `${styles.homeDot} ${styles.homeDotDone}` : overdue ? `${styles.homeDot} ${styles.homeDotOverdue}` : styles.homeDot} aria-hidden="true">
          {done ? "✓" : overdue ? "!" : null}
        </span>
        <Link
          href={`/hogar/${householdId}/tareas/dia/${day.id}`}
          className={done ? `${styles.homeRowTitle} ${styles.homeRowTitleDone}` : styles.homeRowTitle}
        >
          {chore.title}
        </Link>
        {done ? <span className="visually-hidden">{t("row.done")}</span> : null}
        {overdue ? <span className="visually-hidden">{t("row.overdue")}</span> : null}
        {review ? (
          <span className={styles.homeReview}>{t("home.review")}</span>
        ) : (
          <span className={overdue ? `${styles.homeWho} ${styles.homeWhoOverdue}` : styles.homeWho}>{who}</span>
        )}
      </div>
      {review ? <p className={styles.homeWho}>{name}</p> : null}
      {actions.length > 0 ? <div className={styles.homeRowActions}>{actions}</div> : null}
    </li>
  );
}
