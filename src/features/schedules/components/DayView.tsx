"use client";
// "Cada día": se elige un día de esta semana y se ve, por persona, cuándo está fuera (barra de 6:00 a 24:00
// y el detalle en texto). Las ausencias cubren el día entero.
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { barPosition, BAR_END, BAR_START, formatDay, formatTime } from "../format";
import { absenceOn, blocksOf, isoWeekday, toMinutes, weekDates } from "../time";
import { SCHEDULE_KINDS, WEEKDAYS, type Absence, type ScheduleBlock, type SchedulePerson, type Weekday } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  people: SchedulePerson[];
  blocks: ScheduleBlock[];
  absences: Absence[];
  // Hoy y la hora actual (minutos) en la zona horaria del hogar
  today: string;
  nowMinutes: number;
  currentUserId: string;
};

export function DayView({ people, blocks, absences, today, nowMinutes, currentUserId }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const [day, setDay] = useState<Weekday>(isoWeekday(today));
  const dates = weekDates(today);
  const date = dates[day];
  const isToday = date === today;

  const nameOf = (p: SchedulePerson) => (p.userId === currentUserId ? t("youCap") : p.name);
  const what = (b: ScheduleBlock) => b.label ?? t(`kinds.${b.kind}`);
  const nowLeft = barPosition(nowMinutes, nowMinutes + 1)?.left;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("day.title")}</h2>
      <div className={styles.dayTabs} role="tablist" aria-label={t("day.title")}>
        {WEEKDAYS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            aria-label={`${t(`weekdays.${d}`)} ${formatDay(dates[d], locale)}`}
            className={d === day ? styles.dayTabActive : styles.dayTab}
            onClick={() => setDay(d)}
          >
            <span aria-hidden="true">{t(`weekdaysShort.${d}`)}</span>
            <span className={styles.dayNumber} aria-hidden="true">
              {Number(dates[d].slice(8))}
            </span>
            {dates[d] === today ? <span className={styles.todayDot} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      <p className={styles.muted}>
        {t(`weekdays.${day}`)} {formatDay(date, locale)}
        {isToday ? ` · ${t("day.today")}` : ""}
      </p>

      <ul className={styles.dayList}>
        <li aria-hidden="true">
          <div className={styles.scale}>
            {[BAR_START, 12 * 60, 18 * 60, BAR_END].map((m) => (
              <span key={m}>{m / 60}:00</span>
            ))}
          </div>
        </li>
        {people.map((p) => {
          const absence = absenceOn(p.userId, absences, date);
          const list = blocksOf(p.userId, blocks, day);
          return (
            <li key={p.userId}>
              <div className={styles.dayRowHead}>
                <span className={styles.personName}>{nameOf(p)}</span>
              </div>
              <div className={absence ? `${styles.bar} ${styles.barAway}` : styles.bar} aria-hidden="true">
                {absence
                  ? null
                  : list.map((b) => {
                      const pos = barPosition(toMinutes(b.startsAt) ?? 0, toMinutes(b.endsAt) ?? 0);
                      return pos ? (
                        <span
                          key={b.id}
                          className={`${styles.segment} ${styles[`kind_${b.kind}`]}`}
                          style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                        />
                      ) : null;
                    })}
                {isToday && nowLeft !== undefined ? <span className={styles.nowLine} style={{ left: `${nowLeft}%` }} /> : null}
              </div>
              <p className={styles.blockText}>
                {absence
                  ? t("day.away") + (absence.note ? ` · ${absence.note}` : "")
                  : list.length === 0
                    ? t("day.nothing")
                    : list.map((b) => `${what(b)} ${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`).join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>

      <ul className={styles.legend}>
        {SCHEDULE_KINDS.map((k) => (
          <li key={k}>
            <span className={`${styles.swatch} ${styles[`kind_${k}`]}`} aria-hidden="true" />
            {t(`kinds.${k}`)}
          </li>
        ))}
        <li>
          <span className={`${styles.swatch} ${styles.barAway}`} aria-hidden="true" />
          {t("day.awayLegend")}
        </li>
      </ul>
    </section>
  );
}
