// Página /hogar/<id>/mas (pestaña "Más" de la barra de abajo): la configuración del hogar, el resto de
// sus secciones y lo tuyo (lista personal y avisos).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getHousehold } from "@/features/households/server";
import { MoreMenu } from "@/features/navigation";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdMorePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("More");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const household = await getHousehold(id);
  if (!household) notFound();

  const me = household.members.find((m) => m.userId === userId);
  const isAdult = me?.role === "admin" || me?.role === "member";
  const isResident = isAdult || me?.role === "minor";

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
      </section>
      <MoreMenu household={{ id: household.id, name: household.name, isResident, isAdult }} />
    </>
  );
}
