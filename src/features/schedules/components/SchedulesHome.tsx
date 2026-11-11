// Horarios en Inicio: quién está en casa ahora y quién fuera (y hasta cuándo), según lo apuntado.
// La semana entera, las ausencias y editar el horario están en su página.
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HomeSection, homeStyles } from "@/components/ui/HomeSection";
import { formatDay, formatTime } from "../format";
import { DAY_END, DAY_START, dayPresence, presenceAt } from "../time";
import type { Absence, ScheduleBlock, SchedulePerson, Weekday } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  people: SchedulePerson[];
  blocks: ScheduleBlock[];
  absences: Absence[];
  // Ahora en la zona horaria del hogar
  now: { date: string; weekday: Weekday; minutes: number };
  currentUserId: string;
};

export function SchedulesHome({ householdId, people, blocks, absences, now, currentUserId }: Props) {
  const t = useTranslations("Schedules");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const base = `/hogar/${householdId}/horarios`;
  const what = (b: ScheduleBlock) => b.label ?? t(`kinds.${b.kind}`);
  const hasAnything = blocks.length > 0 || absences.length > 0;

  // Primero quien está en casa; tú, el primero de tu grupo
  const rows = people
    .map((person) => ({ person, presence: presenceAt(person.userId, blocks, absences, now) }))
    .sort(
      (a, b) =>
        Number(b.presence.state === "home") - Number(a.presence.state === "home") ||
        Number(b.person.userId === currentUserId) - Number(a.person.userId === currentUserId),
    );
  const home = rows.filter((r) => r.presence.state === "home").length;

  // Barras del día: "Tú" primero y luego el orden de people
  const bars = [...people]
    .sort((a, b) => Number(b.userId === currentUserId) - Number(a.userId === currentUserId))
    .map((person) => ({ person, day: dayPresence(person.userId, blocks, absences, now) }));
  const pct = (minutes: number) => ((minutes - DAY_START) / (DAY_END - DAY_START)) * 100;
  const nowInWindow = now.minutes >= DAY_START && now.minutes < DAY_END;

  return (
    <HomeSection
      title={t("home.title")}
      meta={t("home.count", { home, total: people.length })}
      href={base}
      linkLabel={tHome("seeWeek")}
      linkAriaLabel={tHome("seeWeekOf")}
    >
      <div className={homeStyles.card}>
        {hasAnything ? (
          <>
            <div className={styles.dayBars} aria-hidden="true">
              {bars.map(({ person, day }) => (
                <div key={person.userId} className={styles.dayRow}>
                  <span className={styles.dayName}>{person.userId === currentUserId ? t("youCap") : person.name}</span>
                  <span className={styles.dayTrack}>
                    <span className={styles.dayClip}>
                      {day.away ? (
                        <i className={styles.dayAway} />
                      ) : (
                        day.home.map((seg) => (
                          <i
                            key={seg.from}
                            className={styles.dayHome}
                            style={{ left: `${pct(seg.from)}%`, width: `${pct(seg.to) - pct(seg.from)}%` }}
                          />
                        ))
                      )}
                    </span>
                    {nowInWindow ? <i className={styles.dayNow} style={{ left: `${pct(now.minutes)}%` }} /> : null}
                  </span>
                </div>
              ))}
              <div className={styles.dayMarks}>
                <span />
                <span className={styles.dayMarksScale}>
                  {[8, 12, 16, 20, 24].map((h) => (
                    <span key={h} style={{ left: `${pct(h * 60)}%` }}>
                      {h}h
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <ul className="visually-hidden">
              {rows.map(({ person, presence }) => (
                <li key={person.userId} className={homeStyles.row}>
                  <span className={styles.homePerson}>
                    <span className={presence.state === "home" ? styles.dotHome : styles.dotOut} aria-hidden="true" />
                    <span className={homeStyles.rowMain}>
                      <span className={homeStyles.rowTitle}>{person.userId === currentUserId ? t("youCap") : person.name}</span>
                      <span className={homeStyles.rowMeta}>
                        {presence.state === "home"
                          ? presence.next
                            ? `${t("home.atHome")} · ${t("now.leaves", { time: formatTime(presence.next.startsAt), what: what(presence.next) })}`
                            : t("home.atHome")
                          : presence.state === "out"
                            ? t("now.until", { what: what(presence.block), time: formatTime(presence.block.endsAt) })
                            : t("now.awayUntil", { date: formatDay(presence.absence.endsOn, locale) }) +
                              (presence.absence.note ? ` · ${presence.absence.note}` : "")}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={homeStyles.muted}>{t("home.empty")}</p>
        )}
        <ButtonLink href={`${base}/editar`} fullWidth>
          {t("home.mine")}
        </ButtonLink>
      </div>
    </HomeSection>
  );
}
