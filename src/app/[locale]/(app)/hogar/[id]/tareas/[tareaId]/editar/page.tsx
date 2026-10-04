// Página /hogar/<id>/tareas/<tarea>/editar: cambiar o borrar una tarea (solo adultos del hogar).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChoreActionButton, ChoreForm, uuidSchema } from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../../page.module.css";

type Props = {
  params: Promise<{ id: string; tareaId: string }>;
};

export default async function EditChorePage({ params }: Props) {
  const { id, tareaId } = await params;
  const t = await getTranslations("Chores");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(tareaId).success) notFound();
  const overview = await getChoresOverview(id, userId);
  const chore = overview?.chores.find((c) => c.id === tareaId);
  if (!overview?.isAdult || !chore) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/tareas/todas`} className={styles.back}>
        ← {t("manage.title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("form.editTitle")}</h1>
        <p className={styles.subtitle}>{t("form.editSubtitle")}</p>
      </section>
      <ChoreForm
        householdId={id}
        timezone={overview.timezone}
        today={overview.today}
        people={overview.people}
        me={userId}
        chore={chore}
      />
      <ChoreActionButton
        look="secondary"
        fullWidth
        fields={{ householdId: id, intent: "deleteChore", choreId: chore.id }}
        label={t("form.delete")}
        confirmText={t("form.deleteConfirm", { title: chore.title })}
      />
    </>
  );
}
