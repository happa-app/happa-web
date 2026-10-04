// Página /hogar/<id>/horarios/ausencia/<ausencia>: cambiar las fechas o la nota de una ausencia
// (tuya o de tu menor).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AbsenceForm, nowIn, uuidSchema } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; ausenciaId: string }>;
};

export default async function EditAbsencePage({ params }: Props) {
  const { id, ausenciaId } = await params;
  const t = await getTranslations("Schedules");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(ausenciaId).success) notFound();
  const overview = await getScheduleOverview(id, userId);
  const absence = overview?.absences.find((a) => a.id === ausenciaId);
  const person = overview?.people.find((p) => p.userId === absence?.userId);
  if (!overview || !absence || !person?.canEdit) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/horarios`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("absenceForm.editTitle")}</h1>
      </section>
      <AbsenceForm
        householdId={id}
        personId={person.userId}
        timezone={overview.timezone}
        today={nowIn(overview.timezone).date}
        absence={absence}
      />
    </>
  );
}
