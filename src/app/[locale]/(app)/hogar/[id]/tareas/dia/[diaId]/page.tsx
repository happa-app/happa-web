// Página /hogar/<id>/tareas/dia/<día>: un día de una tarea, con lo que ha pasado y lo que puedes hacer
// (marcarla, quedártela, dar el visto bueno, decir que no está hecha o, si eres adulto, cambiar de persona).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChoreDayDetail, uuidSchema } from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; diaId: string }>;
};

export default async function ChoreDayPage({ params }: Props) {
  const { id, diaId } = await params;
  const t = await getTranslations("Chores");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(diaId).success) notFound();
  const overview = await getChoresOverview(id, userId);
  const day = overview?.days.find((d) => d.id === diaId);
  const chore = overview?.chores.find((c) => c.id === day?.choreId);
  if (!overview || !day || !chore) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/tareas`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{chore.title}</h1>
      </section>
      <ChoreDayDetail
        householdId={id}
        day={day}
        chore={chore}
        people={overview.people}
        me={userId}
        isAdult={overview.isAdult}
        today={overview.today}
        timezone={overview.timezone}
      />
      {overview.isAdult ? (
        <Link href={`/hogar/${id}/tareas/${chore.id}/editar`} className={styles.inlineLink}>
          {t("day.editChore")}
        </Link>
      ) : null}
    </>
  );
}
