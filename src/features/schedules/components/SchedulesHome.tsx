// Horarios en Inicio: quién está en casa ahora y quién fuera (y hasta cuándo), según lo apuntado.
// La semana entera, las ausencias y editar el horario están en su página.
import { useLocale, useTranslations } from "next-intl";
import { ClockIcon } from "@/components/brand/Icons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HomeSection, homeStyles } from "@/components/ui/HomeSection";
import { formatDay, formatTime } from "../format";
import { fromMinutes, presenceAt } from "../time";
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

  return (
    <HomeSection
      title={t("title")}
      icon={<ClockIcon />}
      href={base}
      linkLabel={tHome("seeAll")}
      linkAriaLabel={tHome("seeAllOf", { section: t("title") })}
    >
      <div className={homeStyles.card}>
        {hasAnything ? (
          <div>
            <p className={homeStyles.label}>
              {t("now.title", { time: formatTime(fromMinutes(now.minutes)) })} · {t("home.count", { home, total: people.length })}
            </p>
            <ul className={homeStyles.list}>
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
          </div>
        ) : (
          <p className={homeStyles.muted}>{t("home.empty")}</p>
        )}
        <ButtonLink href={`${base}/editar`} variant="secondary" fullWidth>
          {t("actions.editMine")}
        </ButtonLink>
      </div>
    </HomeSection>
  );
}
