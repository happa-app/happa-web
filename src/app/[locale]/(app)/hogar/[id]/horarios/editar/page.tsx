// Página /hogar/<id>/horarios/editar: tu horario semanal en este hogar (o el de tu menor, con
// ?persona=<id>): añadir franjas, verlas, editarlas o borrarlas, y copiar el tuyo de otro hogar.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BlockForm, BlockList, CopySchedule, uuidSchema } from "@/features/schedules";
import { getOtherSchedules, getScheduleOverview } from "@/features/schedules/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditSchedulePage({ params, searchParams }: Props) {
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
  // Solo tu horario o el de un menor del que eres tutor
  if (!overview || !person?.canEdit) notFound();

  const isMe = personId === userId;
  const others = isMe ? await getOtherSchedules(id, userId) : [];
  const blocks = overview.blocks.filter((b) => b.userId === personId);

  return (
    <>
      <Link href={`/hogar/${id}/horarios`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{isMe ? t("editor.titleMine") : t("editor.titleOf", { name: person.name })}</h1>
        <p className={styles.subtitle}>{t("editor.subtitle")}</p>
      </section>

      <BlockList householdId={id} personId={personId} blocks={blocks} />

      <h2 className={styles.sectionTitle}>{t("editor.addTitle")}</h2>
      <BlockForm householdId={id} personId={personId} />

      {isMe ? <CopySchedule householdId={id} personId={personId} others={others} /> : null}
    </>
  );
}
