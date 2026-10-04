// Todas las tareas del hogar: qué son, cada cuánto, a quién le tocan y cuándo es la próxima.
// Los adultos pueden editarlas.
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { schedulePhrase } from "../describe";
import { formatDay } from "../format";
import type { Chore, ChoreDay } from "../types";
import { EffortDots } from "./EffortDots";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  chores: Chore[];
  days: ChoreDay[];
  names: Record<string, string>;
  me: string;
  isAdult: boolean;
  today: string;
};

export function ChoreList({ householdId, chores, days, names, me, isAdult, today }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const nameOf = (userId: string | null) =>
    userId === null ? t("free") : userId === me ? t("youCap") : (names[userId] ?? t("someone"));

  if (chores.length === 0) {
    return <p className={styles.empty}>{isAdult ? t("manage.emptyAdult") : t("manage.empty")}</p>;
  }

  return (
    <ul className={styles.list}>
      {chores.map((chore) => {
        const schedule = schedulePhrase(chore, locale);
        const who =
          chore.assignment === "fixed"
            ? t("who.fixed", { name: nameOf(chore.assigneeId) })
            : chore.assignment === "rotation"
              ? t("who.rotation", { names: chore.rotation.map((r) => nameOf(r.userId)).join(" → ") })
              : t("who.free");
        const next = days
          .filter((d) => d.choreId === chore.id && d.dueOn >= today && d.status === "pending")
          .sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
        const when = next
          ? t("manage.next", {
              date: next.dueOn === today ? t("today") : formatDay(next.dueOn, locale),
              name: nameOf(next.assigneeId),
            })
          : t("manage.noNext");

        return (
          <li key={chore.id} className={styles.choreRow}>
            <div className={styles.choreMain}>
              <div className={styles.rowTitleLine}>
                <p className={styles.rowTitle}>{chore.title}</p>
                <EffortDots effort={chore.effort} />
              </div>
              <p className={styles.rowMeta}>{`${t(schedule.key, schedule.values)} · ${who}`}</p>
              <p className={styles.rowMeta}>
                <span>{when}</span>
                {chore.requiresApproval ? <span className={styles.pill}>{t("manage.approval")}</span> : null}
              </p>
              {chore.notes ? <p className={styles.rowMeta}>“{chore.notes}”</p> : null}
            </div>
            {isAdult ? (
              <Link href={`/hogar/${householdId}/tareas/${chore.id}/editar`} className={styles.textLink}>
                {t("manage.edit")}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
