// Enlaces pequeños a los textos legales (términos y privacidad). La ley pide que se puedan
// encontrar fácilmente: salen en la portada y en "Más".
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./LegalLinks.module.css";

export function LegalLinks() {
  const t = useTranslations("Legal");
  return (
    <nav className={styles.links} aria-label={t("linksLabel")}>
      <Link href="/legal/terminos">{t("terms")}</Link>
      <span aria-hidden="true">·</span>
      <Link href="/legal/privacidad">{t("privacy")}</Link>
    </nav>
  );
}
