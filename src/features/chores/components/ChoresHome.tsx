// Tareas en Inicio: cuántas te tocan, y las de hoy (más las tuyas atrasadas) con el botón de "hecha".
// Los próximos días, el reparto de la semana y crear o cambiar tareas están en su página.
import { useTranslations } from "next-intl";
import { BroomIcon } from "@/components/brand/Icons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HomeSection, homeStyles } from "@/components/ui/HomeSection";
import { Link } from "@/i18n/navigation";
import { isOverdue, sortDays, summarize } from "../logic";
import type { ChoresOverview } from "../types";
import { ChoreDayRow } from "./ChoreDayRow";
import styles from "./Chores.module.css";

// Cuántas filas como mucho (el resto, en su página)
const MAX_ROWS = 5;

type Props = {
  householdId: string;
  overview: ChoresOverview;
  currentUserId: string;
};

export function ChoresHome({ householdId, overview, currentUserId: me }: Props) {
  const t = useTranslations("Chores");
  const tHome = useTranslations("Home");
  const base = `/hogar/${householdId}/tareas`;
  const { today, people, isAdult, chores, days } = overview;
  const names = Object.fromEntries(people.map((p) => [p.userId, p.name]));
  const titles = new Map(chores.map((c) => [c.id, c.title]));
  const summary = summarize(days, me, today, isAdult, chores.length);
  const extra = [
    summary.myOverdue > 0 ? t("summary.overdue", { count: summary.myOverdue }) : null,
    summary.toApprove > 0 ? t("summary.toApprove", { count: summary.toApprove }) : null,
  ].filter(Boolean);

  // Lo tuyo atrasado y todo lo de hoy (lo tuyo primero, lo hecho al final)
  const rows = [
    ...sortDays(
      days.filter((d) => d.assigneeId === me && isOverdue(d, today)),
      me,
      titles,
    ),
    ...sortDays(
      days.filter((d) => d.dueOn === today),
      me,
      titles,
    ),
  ];
  const shown = rows.slice(0, MAX_ROWS);
  const hidden = rows.length - shown.length;
  const byId = new Map(chores.map((c) => [c.id, c]));

  return (
    <HomeSection
      title={t("title")}
      icon={<BroomIcon />}
      href={base}
      linkLabel={tHome("seeAll")}
      linkAriaLabel={tHome("seeAllOf", { section: t("title") })}
    >
      {chores.length === 0 ? (
        <div className={homeStyles.card}>
          <p className={homeStyles.muted}>{isAdult ? t("emptyAdult") : t("emptyMinor")}</p>
          {isAdult ? (
            <ButtonLink href={`${base}/nueva`} variant="secondary" fullWidth>
              {t("createFirst")}
            </ButtonLink>
          ) : null}
        </div>
      ) : (
        <>
          <p className={styles.homeSummary}>
            <strong>{t("summary.today", { count: summary.myToday })}</strong>
            {extra.length > 0 ? <span className={styles.homeAlert}> · {extra.join(" · ")}</span> : null}
          </p>
          {shown.length === 0 ? (
            <p className={styles.empty}>{t("sections.todayEmpty")}</p>
          ) : (
            <ul className={styles.list}>
              {shown.flatMap((day) => {
                const chore = byId.get(day.choreId);
                return chore
                  ? [
                      <ChoreDayRow
                        key={day.id}
                        householdId={householdId}
                        day={day}
                        chore={chore}
                        names={names}
                        me={me}
                        isAdult={isAdult}
                        today={today}
                        showDate={day.dueOn !== today}
                      />,
                    ]
                  : [];
              })}
            </ul>
          )}
          {hidden > 0 ? (
            <Link href={base} className={styles.homeMore}>
              {t("home.more", { count: hidden })}
            </Link>
          ) : null}
        </>
      )}
    </HomeSection>
  );
}
