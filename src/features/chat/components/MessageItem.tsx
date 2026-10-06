"use client";
// Un mensaje del chat: burbuja con el texto y la hora, "editado" (que enseña lo que ponía antes)
// y el botón ⋯ con lo que se puede hacer (editar si es tuyo y reciente, borrar para mí).
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { canEdit, formatTime } from "../timeline";
import type { ChatMessage, MessageVersion } from "../types";
import styles from "./Chat.module.css";

type Props = {
  message: ChatMessage;
  mine: boolean;
  me: string;
  // Nombre de quien lo mandó (solo en el primero de un grupo de mensajes ajenos)
  senderName: string | null;
  senderAvatarUrl: string | null;
  senderGone: boolean;
  lastInGroup: boolean;
  timezone: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onHide: () => void;
  onRetry: () => void;
  onDiscard: () => void;
  loadVersions: (messageId: string) => Promise<MessageVersion[]>;
};

export function MessageItem(props: Props) {
  const { message, mine, me, senderName, senderAvatarUrl, senderGone, lastInGroup, timezone, menuOpen } = props;
  const t = useTranslations("Chat");
  const locale = useLocale();
  const [versions, setVersions] = useState<MessageVersion[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const time = (timestamp: string) => formatTime(timestamp, locale, timezone);

  async function toggleHistory() {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(true);
    setHistoryError(false);
    try {
      setVersions(await props.loadVersions(message.id));
    } catch {
      setHistoryError(true);
    }
  }

  const bubbleClass = [
    mine ? styles.bubbleMine : styles.bubble,
    message.pending ? styles.bubblePending : "",
    message.failed ? styles.bubbleFailed : "",
  ]
    .filter(Boolean)
    .join(" ");
  const settled = !message.pending && !message.failed;

  return (
    <li className={`${mine ? styles.rowMine : styles.row} ${lastInGroup ? styles.groupEnd : ""}`}>
      {senderName ? (
        <p className={senderGone ? `${styles.sender} ${styles.senderGone}` : styles.sender}>
          <Avatar name={senderName} imageUrl={senderAvatarUrl} size="xs" />
          {senderName}
        </p>
      ) : null}
      <div className={styles.bubbleLine}>
        <div className={bubbleClass}>
          <p className={styles.body}>{message.body}</p>
          <p className={styles.meta}>
            {message.editedAt ? (
              <button type="button" className={styles.editedButton} onClick={toggleHistory} aria-expanded={historyOpen}>
                {t("edited")}
              </button>
            ) : null}
            {message.pending ? <span>{t("sending")}</span> : <time dateTime={message.createdAt}>{time(message.createdAt)}</time>}
          </p>
        </div>
        {settled ? (
          <button
            type="button"
            className={menuOpen ? `${styles.more} ${styles.moreOpen}` : styles.more}
            onClick={props.onToggleMenu}
            aria-expanded={menuOpen}
            aria-label={t("options")}
          >
            ⋯
          </button>
        ) : null}
      </div>

      {message.failed ? (
        <p className={styles.failed} role="alert">
          {t("failed")}
          <button type="button" onClick={props.onRetry}>
            {t("retry")}
          </button>
          <button type="button" onClick={props.onDiscard}>
            {t("discard")}
          </button>
        </p>
      ) : null}

      {menuOpen ? (
        <div className={styles.menu} role="group" aria-label={t("options")}>
          {canEdit(message, me) ? (
            <button type="button" onClick={props.onEdit}>
              {t("edit")}
            </button>
          ) : null}
          {message.editedAt ? (
            <button type="button" onClick={toggleHistory}>
              {historyOpen ? t("hideHistory") : t("showHistory")}
            </button>
          ) : null}
          <button type="button" onClick={props.onHide}>
            {t("hide")}
          </button>
        </div>
      ) : null}

      {historyOpen ? (
        <div className={styles.history}>
          <p className={styles.historyTitle}>{t("historyTitle")}</p>
          {historyError ? (
            <p>{t("errors.generic")}</p>
          ) : versions === null ? (
            <p>{t("loading")}</p>
          ) : (
            <ol className={styles.historyList}>
              {versions.map((v) => (
                <li key={v.replacedAt}>
                  <span className={styles.historyWhen}>
                    {t("historyVersion", { written: time(v.writtenAt), replaced: time(v.replacedAt) })}
                  </span>
                  <span className={styles.historyBody}>{v.body}</span>
                </li>
              ))}
              <li>
                <span className={styles.historyWhen}>{t("historyNow", { time: time(message.editedAt ?? message.createdAt) })}</span>
                <span className={styles.historyBody}>{message.body}</span>
              </li>
            </ol>
          )}
        </div>
      ) : null}
    </li>
  );
}
