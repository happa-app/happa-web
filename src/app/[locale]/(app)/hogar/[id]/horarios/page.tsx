// Página /hogar/<id>/horarios: quién está en casa ahora, cada día de esta semana y las ausencias.
// Para quienes viven en el hogar (adultos y menores); el casero no la ve.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { AbsenceList, DayView, NowCard, nowIn, uuidSchema } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SchedulesPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Schedules");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const overview = await getScheduleOverview(id, userId);
  if (!overview) notFound();

  const now = nowIn(overview.timezone);
  // Menores de los que eres tutor y viven aquí: también puedes apuntar su horario
  const minors = overview.people.filter((p) => p.canEdit && p.userId !== userId);

  return (
    <>
      <Link href={`/hogar/${id}`} className={styles.back}>
        ← {overview.householdName}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>

      <NowCard
        people={overview.people}
        blocks={overview.blocks}
        absences={overview.absences}
        now={now}
        currentUserId={userId}
      />

      <div className={styles.actions}>
        <ButtonLink href={`/hogar/${id}/horarios/editar`} fullWidth>
          {t("actions.editMine")}
        </ButtonLink>
        <ButtonLink href={`/hogar/${id}/horarios/ausencia`} variant="secondary" fullWidth>
          {t("actions.addAbsence")}
        </ButtonLink>
      </div>
      {minors.length > 0 ? (
        <p className={styles.muted}>
          {minors.map((m, i) => (
            <span key={m.userId}>
              {i > 0 ? " · " : ""}
              <Link href={`/hogar/${id}/horarios/editar?persona=${m.userId}`}>{t("actions.editMinor", { name: m.name })}</Link>
            </span>
          ))}
        </p>
      ) : null}

      <DayView
        people={overview.people}
        blocks={overview.blocks}
        absences={overview.absences}
        today={now.date}
        nowMinutes={now.minutes}
        currentUserId={userId}
      />

      <AbsenceList householdId={id} people={overview.people} absences={overview.absences} currentUserId={userId} />
    </>
  );
}
