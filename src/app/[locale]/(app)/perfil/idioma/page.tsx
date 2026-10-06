// Página /perfil/idioma: la app (y los avisos al móvil) en español o en inglés.
import { getLocale, getTranslations } from "next-intl/server";
import { LanguagePicker } from "@/features/profile";
import { getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import { parseLocale } from "@/i18n/locale";
import styles from "../../page.module.css";

export default async function LanguagePage() {
  const t = await getTranslations("Profile");
  const locale = parseLocale(await getLocale());
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("language.title")}</h1>
        <p className={styles.subtitle}>{t("language.subtitle")}</p>
      </section>
      {/* El idioma con el que se ve ahora la app (si el perfil dice otro, al elegir se guarda) */}
      <LanguagePicker current={locale} />
    </>
  );
}
