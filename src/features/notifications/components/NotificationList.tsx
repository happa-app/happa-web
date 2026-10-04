// La lista de avisos. Cada uno es un botón: al pulsarlo queda leído y te lleva a donde toca.
import { useLocale, useTranslations } from "next-intl";
import { openNotification } from "../actions";
import { notificationPhrase } from "../text";
import type { AppNotification } from "../types";
import styles from "./Notifications.module.css";

type Props = {
  notifications: AppNotification[];
  // Ahora, en milisegundos (para "hace 5 minutos")
  now: number;
};

// "hace 5 min" / "5 min ago"; a partir de una semana, la fecha
function timeAgo(timestamp: string, now: number, locale: string): string {
  const seconds = Math.round((new Date(timestamp).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (seconds > -60) return rtf.format(0, "second");
  if (seconds > -3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (seconds > -86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (seconds > -7 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(timestamp));
}

export function NotificationList({ notifications, now }: Props) {
  const t = useTranslations("Notifications");
  const locale = useLocale();

  if (notifications.length === 0) return <p className={styles.empty}>{t("empty")}</p>;

  return (
    <ul className={styles.list}>
      {notifications.map((n) => {
        const phrase = notificationPhrase(n, locale, t("someone"));
        const unread = n.readAt === null;
        return (
          <li key={n.id}>
            <form action={openNotification}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" className={unread ? styles.itemUnread : styles.item}>
                <span className={unread ? styles.dot : styles.dotOff} aria-hidden="true" />
                <span className={styles.itemBody}>
                  <span className={styles.itemText}>
                    {unread ? <span className="visually-hidden">{t("unreadPrefix")} </span> : null}
                    {t(phrase.key, phrase.values)}
                  </span>
                  <span className={styles.itemMeta}>
                    {n.data.household ? `${n.data.household} · ` : ""}
                    <time dateTime={n.createdAt}>{timeAgo(n.createdAt, now, locale)}</time>
                  </span>
                </span>
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
