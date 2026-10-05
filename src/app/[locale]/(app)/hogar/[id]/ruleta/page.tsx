// Página /hogar/<id>/ruleta (pestaña "Ruleta" de la barra de abajo). La ruleta del marrón es lo
// siguiente que se construye; de momento, esta página lo anuncia.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { WheelIcon } from "@/components/brand/Icons";
import { Card } from "@/components/ui/Card";
import { getHousehold } from "@/features/households/server";
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
  if (!data?.claims.sub) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const household = await getHousehold(id);
  if (!household) notFound();

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{household.name}</p>
      </section>
      <Card>
        <div className={styles.soon}>
          <span className={styles.soonIcon}>
            <WheelIcon size={40} />
          </span>
          <p className={styles.sectionTitle}>{t("soonTitle")}</p>
          <p className={styles.subtitle}>{t("soonText")}</p>
        </div>
      </Card>
    </>
  );
}
