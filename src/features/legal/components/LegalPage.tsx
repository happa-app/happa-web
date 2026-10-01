// Plantilla de las páginas legales. De momento muestra que el texto está en preparación.
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import styles from "./LegalPage.module.css";

type Props = {
  document: "terms" | "privacy";
};

export async function LegalPage({ document }: Props) {
  const t = await getTranslations("Legal");

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logoLink}>
        <Logo />
      </Link>
      <article className={styles.card}>
        <h1 className={styles.title}>{t(document)}</h1>
        <p>{t("draftNotice")}</p>
      </article>
    </main>
  );
}
