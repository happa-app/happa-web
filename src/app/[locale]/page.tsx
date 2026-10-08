// Portada para quien no ha iniciado sesión (con sesión, el proxy lleva a /inicio).
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/features/legal";
import { Link } from "@/i18n/navigation";
import styles from "./landing.module.css";

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <Logo size="lg" />
        <h1 className={styles.tagline}>{t("tagline")}</h1>
        <p className={styles.description}>{t("description")}</p>
      </div>
      <div className={styles.actions}>
        <Link href="/registro" className={`${styles.action} ${styles.primary}`}>
          {t("signup")}
        </Link>
        <Link href="/login" className={`${styles.action} ${styles.secondary}`}>
          {t("login")}
        </Link>
      </div>
      <LegalLinks />
    </main>
  );
}
