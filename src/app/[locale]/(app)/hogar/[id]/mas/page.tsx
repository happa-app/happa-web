// Página /hogar/<id>/mas (pestaña "Más" de la barra de abajo): la configuración del hogar, lo tuyo
// (tu lista personal) y cerrar sesión. Lo que está en Inicio no se repite y los avisos están en la
// campana de arriba.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getHousehold } from "@/features/households/server";
import { SignOutButton } from "@/features/auth";
import { LegalLinks } from "@/features/legal";
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

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
      </section>
      <MoreMenu household={{ id: household.id, name: household.name }} />
      <SignOutButton fullWidth />
      <LegalLinks />
    </>
  );
}
