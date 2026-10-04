// Página /hogar/<id>/horarios/franja/<franja>: editar una franja de tu horario (o del de tu menor).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BlockForm, uuidSchema } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; franjaId: string }>;
};

export default async function EditBlockPage({ params }: Props) {
  const { id, franjaId } = await params;
  const t = await getTranslations("Schedules");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(franjaId).success) notFound();
  const overview = await getScheduleOverview(id, userId);
  const block = overview?.blocks.find((b) => b.id === franjaId);
  const person = overview?.people.find((p) => p.userId === block?.userId);
  if (!overview || !block || !person?.canEdit) notFound();

  const back =
    person.userId === userId ? `/hogar/${id}/horarios/editar` : `/hogar/${id}/horarios/editar?persona=${person.userId}`;

  return (
    <>
      <Link href={back} className={styles.back}>
        ← {person.userId === userId ? t("editor.titleMine") : t("editor.titleOf", { name: person.name })}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("form.editTitle")}</h1>
      </section>
      <BlockForm householdId={id} personId={person.userId} block={block} />
    </>
  );
}
