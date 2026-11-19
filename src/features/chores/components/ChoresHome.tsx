// Tareas en Inicio: un post-it con lo que te toca y una lista compacta con el resto de lo de hoy (más tus atrasadas).
// Los próximos días, el reparto de la semana y crear o cambiar tareas están en su página.
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section, sectionStyles } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { isOverdue, pickNote, sortDays } from "../logic";
import type { ChoresOverview } from "../types";
import { ChoreHomeRow } from "./ChoreHomeRow";
import { ChorePostit } from "./ChorePostit";
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
  const { note, rest } = pickNote(shown, me);
  // Si no tienes nada pendiente hoy (aunque haya filas de otras personas), "Hoy te libras."
  const freeToday = !note && !shown.some((d) => d.assigneeId === me && d.status === "pending");
  const noteChore = note ? byId.get(note.choreId) : undefined;

  return (
    <Section
      title={t("title")}
      link={{ href: base, label: tHome("seeAll"), ariaLabel: tHome("seeAllOf", { section: t("title") }) }}
    >
      {chores.length === 0 ? (
        <div className={sectionStyles.card}>
          <p className={sectionStyles.muted}>{isAdult ? t("home.emptyAdult") : t("home.emptyMinor")}</p>
          {isAdult ? (
            <ButtonLink href={`${base}/nueva`} fullWidth>
              {t("home.createFirst")}
            </ButtonLink>
          ) : null}
        </div>
      ) : (
        <>
          {/* Sin tareas tuyas hoy: el post-it sale igual, con "Hoy te libras." */}
          {(note && noteChore) || freeToday ? (
            <ChorePostit
              householdId={householdId}
              note={note}
              chore={noteChore ?? null}
              isOverdue={note ? isOverdue(note, today) : false}
              base={base}
            />
          ) : null}
          {rest.length > 0 ? (
            <ul className={styles.homeList}>
              {rest.flatMap((day) => {
                const chore = byId.get(day.choreId);
                return chore
                  ? [
                      <ChoreHomeRow
                        key={day.id}
                        householdId={householdId}
                        day={day}
                        chore={chore}
                        names={names}
                        me={me}
                        isAdult={isAdult}
                        today={today}
                      />,
                    ]
                  : [];
              })}
            </ul>
          ) : null}
          {hidden > 0 ? (
            <Link href={base} className={styles.homeMore}>
              {t("home.more", { count: hidden })}
            </Link>
          ) : null}
        </>
      )}
    </Section>
  );
}
