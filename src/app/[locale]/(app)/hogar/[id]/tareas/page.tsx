// Página /hogar/<id>/tareas: lo que te toca hoy, lo atrasado, lo que espera el visto bueno, los próximos
// días y el reparto de la semana. Para quienes viven en el hogar (adultos y menores); el casero no la ve.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  addDays,
  ChoreDaySection,
  ChorePostit,
  isOverdue,
  pickNote,
  sortDays,
  UpcomingDays,
  uuidSchema,
  WeekShare,
  weekShare,
} from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChoresPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Chores");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const overview = await getChoresOverview(id, userId);
  if (!overview) notFound();

  const { today, people, isAdult, chores, days } = overview;
  const names = Object.fromEntries(people.map((p) => [p.userId, p.name]));
  const sorted = sortDays(days, userId, new Map(chores.map((c) => [c.id, c.title])));
  const section = { householdId: id, chores, names, me: userId, isAdult, today };
  // El post-it: lo tuyo atrasado y lo de hoy; la primera pendiente tuya (la atrasada antes)
  const mine = sortDays(
    days.filter((d) => d.assigneeId === userId && (isOverdue(d, today) || d.dueOn === today)),
    userId,
    new Map(chores.map((c) => [c.id, c.title])),
  );
  const { note } = pickNote(mine, userId);
  const noteChore = note ? (chores.find((c) => c.id === note.choreId) ?? null) : null;
  // La tarea del post-it no se repite como fila
  const rest = sorted.filter((d) => d.id !== note?.id);
  const overdue = rest.filter((d) => isOverdue(d, today));
  const toApprove = sorted.filter((d) => d.status === "review");

  return (
    <>
      <Link href={`/hogar/${id}`} className={styles.back}>
        ← {overview.householdName}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>

      {chores.length === 0 ? (
        <>
          <p className={styles.muted}>{isAdult ? t("emptyAdult") : t("emptyMinor")}</p>
          {isAdult ? (
            <ButtonLink href={`/hogar/${id}/tareas/nueva`} fullWidth>
              {t("createFirst")}
            </ButtonLink>
          ) : null}
        </>
      ) : (
        <>
          <ChorePostit
            householdId={id}
            note={note}
            chore={noteChore}
            isOverdue={note ? isOverdue(note, today) : false}
            base={`/hogar/${id}/tareas`}
          />

          <ChoreDaySection {...section} title={t("sections.overdue")} days={overdue} showDate showCount />
          <ChoreDaySection
            {...section}
            title={isAdult ? t("sections.toApprove") : t("sections.waiting")}
            days={toApprove}
            showDate
            showCount
          />
          <ChoreDaySection
            {...section}
            title={t("sections.today")}
            days={rest.filter((d) => d.dueOn === today && d.status !== "review")}
            emptyText={note?.dueOn === today ? undefined : t("sections.todayEmpty")}
          />
          <UpcomingDays
            {...section}
            days={sorted.filter((d) => d.dueOn > today && d.dueOn <= addDays(today, 6) && d.status !== "review")}
          />
          <WeekShare rows={weekShare(days, chores, people, today)} me={userId} />

          <div className={styles.actionsTwo}>
            {isAdult ? (
              <ButtonLink href={`/hogar/${id}/tareas/nueva`} fullWidth>
                {t("actions.new")}
              </ButtonLink>
            ) : null}
            <ButtonLink href={`/hogar/${id}/tareas/todas`} variant="secondary" fullWidth>
              {t("actions.all")}
            </ButtonLink>
          </div>
        </>
      )}
    </>
  );
}
