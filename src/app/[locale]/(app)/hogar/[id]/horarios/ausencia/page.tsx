// Página /hogar/<id>/horarios/ausencia: avisar de que vas a estar fuera unos días
// (o tu menor, con ?persona=<id>).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AbsenceForm, nowIn, uuidSchema } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NewAbsencePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { persona } = await searchParams;
  const t = await getTranslations("Schedules");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const personId = typeof persona === "string" && uuidSchema.safeParse(persona).success ? persona : userId;
  const overview = await getScheduleOverview(id, userId);
  const person = overview?.people.find((p) => p.userId === personId);
  if (!overview || !person?.canEdit) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/horarios`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>
          {personId === userId ? t("absenceForm.newTitle") : t("absenceForm.newTitleOf", { name: person.name })}
        </h1>
        <p className={styles.subtitle}>{t("absenceForm.subtitle")}</p>
      </section>
      <AbsenceForm householdId={id} personId={personId} timezone={overview.timezone} today={nowIn(overview.timezone).date} />
    </>
  );
}
