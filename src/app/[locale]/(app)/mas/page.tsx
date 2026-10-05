// Página /mas: la pestaña "Más" cuando aún no estás en ningún hogar (solo lo tuyo).
// Si ya estás en uno, lleva a la de ese hogar.
import { getLocale, getTranslations } from "next-intl/server";
import { SignOutButton } from "@/features/auth";
import { MoreMenu } from "@/features/navigation";
import { getNavHouseholds } from "@/features/navigation/server";
import { redirect } from "@/i18n/navigation";
import styles from "../page.module.css";

export default async function MorePage() {
  const t = await getTranslations("More");
  const { householdId } = await getNavHouseholds();
  if (householdId) {
    return redirect({ href: `/hogar/${householdId}/mas`, locale: await getLocale() });
  }

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("noHousehold")}</p>
      </section>
      <MoreMenu household={null} />
      <SignOutButton fullWidth />
    </>
  );
}
