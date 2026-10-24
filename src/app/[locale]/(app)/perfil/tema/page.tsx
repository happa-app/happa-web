// Página /perfil/tema: la app en claro, en oscuro o igual que el dispositivo.
import { getTranslations } from "next-intl/server";
import { ThemePicker } from "@/features/profile";
import { Link } from "@/i18n/navigation";
import styles from "../../page.module.css";

export default async function ThemePage() {
  const t = await getTranslations("Profile");
  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("theme.title")}</h1>
        <p className={styles.subtitle}>{t("theme.subtitle")}</p>
      </section>
      <ThemePicker />
    </>
  );
}
