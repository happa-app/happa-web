// Página /hogar/<id>/tareas/nueva: crear una tarea (solo adultos del hogar).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChoreForm, uuidSchema } from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewChorePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Chores");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const overview = await getChoresOverview(id, userId);
  if (!overview?.isAdult) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/tareas`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("form.newTitle")}</h1>
        <p className={styles.subtitle}>{t("form.newSubtitle")}</p>
      </section>
      <ChoreForm
        householdId={id}
        timezone={overview.timezone}
        today={overview.today}
        people={overview.people}
        me={userId}
      />
    </>
  );
}
