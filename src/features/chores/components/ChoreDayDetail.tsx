// Detalle de un día de una tarea: a quién le toca, cómo va, qué ha pasado y lo que puedes hacer.
import { useLocale, useTranslations } from "next-intl";
import { schedulePhrase } from "../describe";
import { formatDay, formatMoment } from "../format";
import { canApprove, canComplete, canReassign, canReopen, canTake, isOverdue } from "../logic";
import type { Chore, ChoreDay, ChorePerson } from "../types";
import { ChoreActionButton } from "./ChoreActionButton";
import { ReassignForm } from "./ReassignForm";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  day: ChoreDay;
  chore: Chore;
  people: ChorePerson[];
  me: string;
  isAdult: boolean;
  today: string;
  timezone: string;
};

export function ChoreDayDetail({ householdId, day, chore, people, me, isAdult, today, timezone }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const nameOf = (userId: string | null) =>
    userId === null
      ? t("free")
      : userId === me
        ? t("youCap")
        : (people.find((p) => p.userId === userId)?.name ?? t("someone"));
  const fields = { householdId, dayId: day.id };
  const schedule = schedulePhrase(chore, locale);
  const status = isOverdue(day, today) ? "overdue" : day.status;
  const who =
    chore.assignment === "fixed"
      ? t("who.fixed", { name: nameOf(chore.assigneeId) })
      : chore.assignment === "rotation"
        ? t("who.rotation", { names: chore.rotation.map((r) => nameOf(r.userId)).join(" → ") })
        : t("who.free");

  // Lo que ha pasado, por orden
  const history = [
    day.doneAt ? { at: day.doneAt, text: t("day.historyDone", { name: nameOf(day.doneBy) }) } : null,
    day.approvedAt ? { at: day.approvedAt, text: t("day.historyApproved", { name: nameOf(day.approvedBy) }) } : null,
    day.reopenedAt ? { at: day.reopenedAt, text: t("day.historyReopened", { name: nameOf(day.reopenedBy) }) } : null,
  ]
    .filter((h): h is { at: string; text: string } => h !== null)
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <div className={styles.card}>
        <dl className={styles.facts}>
          <dt>{t("day.who")}</dt>
          <dd>{nameOf(day.assigneeId)}</dd>
          <dt>{t("day.when")}</dt>
          <dd>{day.dueOn === today ? `${t("todayCap")} (${formatDay(day.dueOn, locale)})` : formatDay(day.dueOn, locale)}</dd>
          <dt>{t("day.status")}</dt>
          <dd>
            <span
              className={
                status === "overdue"
                  ? styles.pillOverdue
                  : status === "review"
                    ? styles.pillReview
                    : status === "done"
                      ? styles.pillDone
                      : styles.pill
              }
            >
              {t(`statuses.${status}`)}
            </span>
          </dd>
          <dt>{t("day.repeats")}</dt>
          <dd>{t(schedule.key, schedule.values)}</dd>
          <dt>{t("day.split")}</dt>
          <dd>{who}</dd>
          <dt>{t("form.effort")}</dt>
          <dd>{t(`efforts.${chore.effort}`)}</dd>
          {chore.notes ? (
            <>
              <dt>{t("day.notes")}</dt>
              <dd>{chore.notes}</dd>
            </>
          ) : null}
        </dl>
        {history.length > 0 || day.manual ? (
          <ul className={styles.history}>
            {history.map((h) => (
              <li key={h.at + h.text}>
                {h.text} · {formatMoment(h.at, locale, timezone)}
              </li>
            ))}
            {day.manual ? <li>{t("day.manual")}</li> : null}
          </ul>
        ) : null}
        {chore.requiresApproval ? <p className={styles.hint}>{t("day.approvalNote")}</p> : null}
      </div>

      <div className={styles.buttonRow}>
        {canComplete(day, me, isAdult) ? (
          <ChoreActionButton
            look="primary"
            fullWidth
            fields={{ ...fields, intent: "complete" }}
            label={day.assigneeId === me || day.assigneeId === null ? t("day.complete") : t("day.completeFor", { name: nameOf(day.assigneeId) })}
          />
        ) : null}
        {canTake(day) ? (
          <ChoreActionButton look="secondary" fullWidth fields={{ ...fields, intent: "take" }} label={t("row.take")} />
        ) : null}
        {canApprove(day, isAdult) ? (
          <ChoreActionButton look="primary" fullWidth fields={{ ...fields, intent: "approve" }} label={t("row.approve")} />
        ) : null}
        {canReopen(day, me, isAdult) ? (
          <ChoreActionButton
            look="secondary"
            fullWidth
            fields={{ ...fields, intent: "reopen" }}
            label={t("row.reopen")}
            confirmText={day.doneBy === me ? undefined : t("row.reopenConfirm", { title: chore.title })}
          />
        ) : null}
      </div>

      {canReassign(day, isAdult) ? (
        <ReassignForm
          key={day.assigneeId ?? "free"}
          householdId={householdId}
          dayId={day.id}
          assigneeId={day.assigneeId}
          people={people}
          me={me}
        />
      ) : null}
    </>
  );
}
