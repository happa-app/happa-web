// Página /hogar/<id>/tareas/todas: todas las tareas del hogar, cada cuánto y a quién le tocan.
// Los adultos crean y editan desde aquí; los menores solo las ven.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ChoreList, uuidSchema } from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AllChoresPage({ params }: Props) {
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
  if (!overview) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/tareas`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("manage.title")}</h1>
        <p className={styles.subtitle}>{overview.isAdult ? t("manage.subtitleAdult") : t("manage.subtitle")}</p>
      </section>

      {overview.isAdult ? (
        <ButtonLink href={`/hogar/${id}/tareas/nueva`} fullWidth>
          {t("actions.new")}
        </ButtonLink>
      ) : null}

      <ChoreList
        householdId={id}
        chores={overview.chores}
        days={overview.days}
        names={Object.fromEntries(overview.people.map((p) => [p.userId, p.name]))}
        me={userId}
        isAdult={overview.isAdult}
        today={overview.today}
      />
    </>
  );
}
