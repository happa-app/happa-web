// Página /hogar/<id>/ruleta (pestaña "Ruleta" de la barra de abajo): la ruleta del marrón. Para quienes
// viven en el hogar: los adultos giran; los menores lo ven y entran si un adulto los incluye.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Roulette } from "@/features/roulette";
import { getRoulettePage } from "@/features/roulette/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoulettePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Roulette");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!z.uuid().safeParse(id).success) notFound();
  const page = await getRoulettePage(id, userId);
  if (!page) notFound();

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle", { name: page.householdName })}</p>
      </section>
      <Roulette
        householdId={id}
        people={page.people}
        me={userId}
        isAdult={page.isAdult}
        timezone={page.timezone}
        initialSpins={page.spins}
      />
    </>
  );
}
