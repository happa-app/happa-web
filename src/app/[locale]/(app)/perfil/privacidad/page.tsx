// Página /perfil/privacidad: tus dos decisiones opcionales (comunicaciones de HAPPA y cesión a empresas
// colaboradoras) y cómo ejercer tus derechos sobre tus datos.
import { getLocale, getTranslations } from "next-intl/server";
import { PRIVACY_EMAIL } from "@/features/legal/owner";
import { PrivacyChoices } from "@/features/profile";
import { getMyPrivacyChoices, getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../../page.module.css";

export default async function PrivacyPage() {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }
  const choices = await getMyPrivacyChoices();

  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("privacy.title")}</h1>
        <p className={styles.subtitle}>{t("privacy.subtitle")}</p>
      </section>

      <PrivacyChoices initial={choices} isMinor={profile.isMinor} />

      <section className={styles.intro}>
        <h2 className={styles.sectionTitle}>{t("privacy.rightsTitle")}</h2>
        <p className={styles.subtitle}>
          {t.rich("privacy.rightsText", {
            email: () => <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>,
          })}
        </p>
        <Link href="/legal/privacidad" className={styles.inlineLink}>
          {t("privacy.policyLink")}
        </Link>
        <Link href="/perfil/borrar" className={styles.inlineLink}>
          {t("privacy.deleteLink")}
        </Link>
      </section>
    </>
  );
}
