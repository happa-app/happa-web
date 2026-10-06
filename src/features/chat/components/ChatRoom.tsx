"use client";
// El chat del hogar: mensajes en vivo, agrupados por día y por persona, y la caja para escribir abajo.
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { buildTimeline, type DayLabel } from "../timeline";
import type { ChatInfo, ChatMessage, ChatPerson } from "../types";
import { Composer } from "./Composer";
import { MessageItem } from "./MessageItem";
import styles from "./Chat.module.css";

type Props = {
  info: ChatInfo;
  people: ChatPerson[];
  me: string;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  // Hoy en la zona horaria del hogar (lo calcula el servidor, para que coincida al cargar)
  today: string;
};

function nearBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
}

function scrollToBottom(smooth: boolean) {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

export function ChatRoom({ info, people, me, initialMessages, initialHasMore, today }: Props) {
  const t = useTranslations("Chat");
  const locale = useLocale();
  const [newBelow, setNewBelow] = useState(0);
  const chat = useChat({
    conversationId: info.conversationId,
    me,
    initialMessages,
    initialHasMore,
    onIncoming: () => {
      if (nearBottom()) requestAnimationFrame(() => scrollToBottom(true));
      else setNewBelow((n) => n + 1);
    },
  });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const keepScroll = useRef<number | null>(null);

  const names = new Map(people.map((p) => [p.userId, p]));
  const timeline = buildTimeline(chat.messages, me, info.timezone, today);

  // Al abrir, al final del chat
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Al cargar mensajes anteriores, la pantalla se queda donde estaba
  useEffect(() => {
    if (keepScroll.current !== null) {
      window.scrollBy(0, document.documentElement.scrollHeight - keepScroll.current);
      keepScroll.current = null;
    }
  }, [chat.messages]);

  // Al bajar del todo, se quita el aviso de mensajes nuevos
  useEffect(() => {
    const onScroll = () => {
      if (nearBottom()) setNewBelow(0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function loadOlder() {
    keepScroll.current = document.documentElement.scrollHeight;
    await chat.loadOlder();
  }

  async function submit() {
    if (editing) {
      const ok = await chat.edit(editing, editText);
      if (ok) {
        setEditing(null);
        setEditText("");
      }
      return;
    }
    if (chat.send(draft)) {
      setDraft("");
      requestAnimationFrame(() => scrollToBottom(true));
    }
  }

  function dayText(label: DayLabel) {
    if (label.kind === "today") return t("today");
    if (label.kind === "yesterday") return t("yesterday");
    return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
      new Date(`${label.date}T00:00:00Z`),
    );
  }

  return (
    <>
      {info.isResident ? null : <p className={styles.notice}>{t("leftNotice")}</p>}

      <section className={styles.chat} aria-label={t("title")}>
        {chat.hasMore ? (
          <button type="button" className={styles.olderButton} onClick={loadOlder} disabled={chat.loadingOlder}>
            {chat.loadingOlder ? t("loading") : t("older")}
          </button>
        ) : chat.messages.length > 0 ? (
          <p className={styles.start}>{t("start")}</p>
        ) : null}

        {chat.messages.length === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}

        <ol className={styles.timeline} role="log" aria-label={t("messages")}>
          {timeline.map((item) => {
            if (item.kind === "day") {
              return (
                <li key={item.key} className={styles.day}>
                  <span>{dayText(item.label)}</span>
                </li>
              );
            }
            const { message } = item;
            const person = message.senderId ? names.get(message.senderId) : undefined;
            const senderName = item.mine || !item.showName ? null : (person?.name ?? t("someone"));
            return (
              <MessageItem
                key={item.key}
                message={message}
                mine={item.mine}
                me={me}
                senderName={senderName}
                senderAvatarUrl={person?.avatarUrl ?? null}
                senderGone={!person?.isMember}
                lastInGroup={item.lastInGroup}
                timezone={info.timezone}
                menuOpen={menuFor === message.id}
                onToggleMenu={() => setMenuFor((current) => (current === message.id ? null : message.id))}
                onEdit={() => {
                  setMenuFor(null);
                  setEditing(message);
                  setEditText(message.body);
                }}
                onHide={() => {
                  setMenuFor(null);
                  if (editing?.id === message.id) setEditing(null);
                  void chat.hide(message);
                }}
                onRetry={() => chat.retry(message)}
                onDiscard={() => chat.discard(message)}
                loadVersions={chat.versions}
              />
            );
          })}
        </ol>
      </section>

      {newBelow > 0 ? (
        <button
          type="button"
          className={styles.newBelow}
          onClick={() => {
            setNewBelow(0);
            scrollToBottom(true);
          }}
        >
          ↓ {t("newBelow", { count: newBelow })}
        </button>
      ) : null}

      {chat.lastHidden ? (
        <div className={styles.toast} role="status">
          <span>{t("hidden")}</span>
          <span>
            <button type="button" onClick={() => void chat.undoHide()}>
              {t("undo")}
            </button>{" "}
            <button type="button" onClick={chat.dismissHidden} aria-label={t("close")}>
              ×
            </button>
          </span>
        </div>
      ) : null}

      {chat.error ? (
        <p className={styles.error} role="alert">
          {t(`errors.${chat.error}`)}
          <button type="button" className={styles.linkButton} onClick={chat.dismissError}>
            {t("close")}
          </button>
        </p>
      ) : null}

      <Composer
        value={editing ? editText : draft}
        onChange={editing ? setEditText : setDraft}
        onSubmit={() => void submit()}
        editing={editing !== null}
        onCancelEdit={() => {
          setEditing(null);
          setEditText("");
        }}
      />
    </>
  );
}
