// Página /avisos/ajustes: activar los avisos en este móvil y elegir qué tipos llegan.
import { getLocale, getTranslations } from "next-intl/server";
import { DevicePush, PreferencesForm } from "@/features/notifications";
import { getPreferences } from "@/features/notifications/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

export default async function NotificationSettingsPage() {
  const t = await getTranslations("Notifications");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const preferences = await getPreferences();

  return (
    <>
      <Link href="/avisos" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("settings.title")}</h1>
        <p className={styles.subtitle}>{t("settings.subtitle")}</p>
      </section>
      <DevicePush />
      <PreferencesForm preferences={preferences} />
    </>
  );
}
