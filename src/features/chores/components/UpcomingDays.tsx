"use client";
// Los próximos días (de mañana a dentro de una semana), día a día. Se puede ver todo o solo lo tuyo.
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { addDays } from "../dates";
import { formatDay } from "../format";
import type { Chore, ChoreDay } from "../types";
import { ChoreDayRow } from "./ChoreDayRow";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  // Ya ordenados (sortDays)
  days: ChoreDay[];
  chores: Chore[];
  names: Record<string, string>;
  me: string;
  isAdult: boolean;
  today: string;
};

export const UPCOMING_DAYS = 6;

export function UpcomingDays({ householdId, days, chores, names, me, isAdult, today }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const [onlyMine, setOnlyMine] = useState(false);
  const byId = new Map(chores.map((c) => [c.id, c]));

  const dates = Array.from({ length: UPCOMING_DAYS }, (_, i) => addDays(today, i + 1));
  const visible = days.flatMap((day) => {
    const chore = byId.get(day.choreId);
    return chore && (!onlyMine || day.assigneeId === me) ? [{ day, chore }] : [];
  });
  const groups = dates
    .map((date) => ({ date, rows: visible.filter((r) => r.day.dueOn === date) }))
    .filter((g) => g.rows.length > 0);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{t("upcoming.title")}</h2>
        <div className={styles.toggle} role="group" aria-label={t("upcoming.title")}>
          <button
            type="button"
            className={onlyMine ? styles.toggleOption : styles.toggleOptionActive}
            aria-pressed={!onlyMine}
            onClick={() => setOnlyMine(false)}
          >
            {t("upcoming.all")}
          </button>
          <button
            type="button"
            className={onlyMine ? styles.toggleOptionActive : styles.toggleOption}
            aria-pressed={onlyMine}
            onClick={() => setOnlyMine(true)}
          >
            {t("upcoming.mine")}
          </button>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className={styles.empty}>{onlyMine ? t("upcoming.emptyMine") : t("upcoming.empty")}</p>
      ) : (
        <div className={styles.groups}>
          {groups.map((g) => (
            <div key={g.date}>
              <h3 className={styles.dayHeading}>
                {g.date === addDays(today, 1) ? t("tomorrow") : formatDay(g.date, locale)}
              </h3>
              <ul className={styles.groupList}>
                {g.rows.map(({ day, chore }) => (
                  <ChoreDayRow
                    key={day.id}
                    householdId={householdId}
                    day={day}
                    chore={chore}
                    names={names}
                    me={me}
                    isAdult={isAdult}
                    today={today}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
