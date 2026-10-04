// Página /avisos: lo que ha pasado en tus hogares y te toca (gastos por confirmar, tareas, la compra...).
// Al pulsar uno queda leído y te lleva a su pantalla.
import { getLocale, getTranslations } from "next-intl/server";
import { markAllNotificationsRead, NotificationList } from "@/features/notifications";
import { getNotifications, serverNow } from "@/features/notifications/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

export default async function NotificationsPage() {
  const t = await getTranslations("Notifications");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) {
    return redirect({ href: "/login", locale });
  }

  const notifications = await getNotifications();
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <>
      <Link href="/inicio" className={styles.back}>
        ← {t("back")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>

      <div className={styles.toolbar}>
        {hasUnread ? (
          <form action={markAllNotificationsRead}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className={styles.textButton}>
              {t("markAll")}
            </button>
          </form>
        ) : (
          <span />
        )}
        <Link href="/avisos/ajustes" className={styles.inlineLink}>
          {t("settingsLink")}
        </Link>
      </div>

      <NotificationList notifications={notifications} now={serverNow()} />
    </>
  );
}
