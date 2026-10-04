// Página /hogar/<id>/tareas: lo que te toca hoy, lo atrasado, lo que espera el visto bueno, los próximos
// días y el reparto de la semana. Para quienes viven en el hogar (adultos y menores); el casero no la ve.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  addDays,
  ChoreDaySection,
  isOverdue,
  sortDays,
  summarize,
  TodaySummary,
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
  const todayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${today}T00:00:00Z`),
  );

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
          <TodaySummary summary={summarize(days, userId, today, isAdult, chores.length)} />

          <ChoreDaySection
            {...section}
            title={t("sections.overdue")}
            days={sorted.filter((d) => isOverdue(d, today))}
            showDate
          />
          <ChoreDaySection
            {...section}
            title={isAdult ? t("sections.toApprove") : t("sections.waiting")}
            days={sorted.filter((d) => d.status === "review")}
            showDate
          />
          <ChoreDaySection
            {...section}
            title={t("sections.today", { date: todayLabel })}
            days={sorted.filter((d) => d.dueOn === today && d.status !== "review")}
            emptyText={t("sections.todayEmpty")}
          />
          <UpcomingDays
            {...section}
            days={sorted.filter((d) => d.dueOn > today && d.dueOn <= addDays(today, 6) && d.status !== "review")}
          />
          <WeekShare rows={weekShare(days, chores, people, today)} me={userId} />

          <div className={styles.actions}>
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
