// Acceso al chat desde la página del hogar: el último mensaje y cuántos hay sin leer.
import { useTranslations } from "next-intl";
import { ChatIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import type { ChatSummary } from "../types";
import styles from "./Chat.module.css";

type Props = {
  href: string;
  summary: ChatSummary;
  // Nombre de quien mandó el último (null si fuiste tú)
  lastSenderName: string | null;
  me: string;
};

export function ChatTile({ href, summary, lastSenderName, me }: Props) {
  const t = useTranslations("Chat");
  const preview =
    summary.lastBody === null
      ? t("tile.empty")
      : summary.lastSenderId === me
        ? t("tile.mine", { body: summary.lastBody })
        : t("tile.last", { name: lastSenderName ?? t("someone"), body: summary.lastBody });

  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.tileIcon}>
        <ChatIcon />
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{t("title")}</span>
        <span className={styles.tilePreview}>{preview}</span>
      </span>
      {summary.unread > 0 ? (
        <span className={styles.badge} aria-label={t("tile.unread", { count: summary.unread })}>
          {summary.unread > 99 ? "99+" : summary.unread}
        </span>
      ) : null}
      <span className={styles.tileChevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
