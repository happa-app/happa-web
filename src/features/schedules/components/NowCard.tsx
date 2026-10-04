// "Ahora": quién está en casa y quién fuera en este momento, según los horarios y ausencias apuntados.
import { useLocale, useTranslations } from "next-intl";
import { formatDay, formatTime } from "../format";
import { fromMinutes, presenceAt } from "../time";
import type { Absence, ScheduleBlock, SchedulePerson, Weekday } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  people: SchedulePerson[];
  blocks: ScheduleBlock[];
  absences: Absence[];
  // Ahora en la zona horaria del hogar
  now: { date: string; weekday: Weekday; minutes: number };
  currentUserId: string;
};

export function NowCard({ people, blocks, absences, now, currentUserId }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const nameOf = (p: SchedulePerson) => (p.userId === currentUserId ? t("youCap") : p.name);
  const what = (b: ScheduleBlock) => b.label ?? t(`kinds.${b.kind}`);

  const rows = people.map((person) => ({ person, presence: presenceAt(person.userId, blocks, absences, now) }));
  const home = rows.filter((r) => r.presence.state === "home");
  const out = rows.filter((r) => r.presence.state !== "home");

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("now.title", { time: formatTime(fromMinutes(now.minutes)) })}</h2>
      <div className={styles.card}>
        <div className={styles.nowGroups}>
          <div className={styles.nowGroup}>
            <p className={styles.nowLabel}>
              <span className={styles.dotHome} aria-hidden="true" />
              {t("now.home", { count: home.length })}
            </p>
            {home.length === 0 ? (
              <p className={styles.muted}>{t("now.nobodyHome")}</p>
            ) : (
              <ul className={styles.people}>
                {home.map(({ person, presence }) => (
                  <li key={person.userId} className={styles.personLine}>
                    <span className={styles.personName}>{nameOf(person)}</span>
                    {presence.state === "home" && presence.next ? (
                      <span className={styles.muted}>
                        {t("now.leaves", { time: formatTime(presence.next.startsAt), what: what(presence.next) })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.nowGroup}>
            <p className={styles.nowLabel}>
              <span className={styles.dotOut} aria-hidden="true" />
              {t("now.out", { count: out.length })}
            </p>
            {out.length === 0 ? (
              <p className={styles.muted}>{t("now.nobodyOut")}</p>
            ) : (
              <ul className={styles.people}>
                {out.map(({ person, presence }) => (
                  <li key={person.userId} className={styles.personLine}>
                    <span className={styles.personName}>{nameOf(person)}</span>
                    <span className={styles.muted}>
                      {presence.state === "away"
                        ? t("now.awayUntil", { date: formatDay(presence.absence.endsOn, locale) }) +
                          (presence.absence.note ? ` · ${presence.absence.note}` : "")
                        : presence.state === "out"
                          ? t("now.until", { what: what(presence.block), time: formatTime(presence.block.endsAt) })
                          : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className={styles.hint}>{t("now.note")}</p>
      </div>
    </section>
  );
}
