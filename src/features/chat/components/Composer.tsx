"use client";
// Caja para escribir. En el ordenador, Intro manda y Mayúsculas+Intro hace un salto de línea;
// en el móvil, Intro hace un salto de línea y se manda con el botón.
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { MAX_MESSAGE } from "../types";
import styles from "./Chat.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  // Editando un mensaje (en vez de escribir uno nuevo)
  editing: boolean;
  onCancelEdit: () => void;
  disabled?: boolean;
};

const COUNTER_FROM = MAX_MESSAGE - 200;

export function Composer({ value, onChange, onSubmit, editing, onCancelEdit, disabled = false }: Props) {
  const t = useTranslations("Chat");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // La caja crece con el texto (hasta un máximo; luego tiene su propia barra)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Al empezar a editar, el cursor va a la caja
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (touch) return;
    event.preventDefault();
    onSubmit();
  }

  const length = value.trim().length;
  return (
    <form
      className={styles.composer}
      onSubmit={(event: { preventDefault(): void }) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {editing ? (
        <p className={styles.composerEditing}>
          {t("editing")}
          <button type="button" className={styles.linkButton} onClick={onCancelEdit}>
            {t("cancel")}
          </button>
        </p>
      ) : null}
      <div className={styles.composerRow}>
        <label htmlFor="chat-message" className="visually-hidden">
          {t("message")}
        </label>
        <textarea
          id="chat-message"
          ref={ref}
          className={styles.textarea}
          rows={1}
          value={value}
          placeholder={t("placeholder")}
          maxLength={MAX_MESSAGE + 500}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={disabled || length === 0 || length > MAX_MESSAGE}
          aria-label={editing ? t("save") : t("send")}
          title={editing ? t("save") : t("send")}
        >
          {editing ? <SaveIcon /> : <SendIcon />}
        </button>
      </div>
      {length >= COUNTER_FROM ? (
        <p className={length > MAX_MESSAGE ? `${styles.counter} ${styles.counterOver}` : styles.counter}>
          {length}/{MAX_MESSAGE}
        </p>
      ) : null}
    </form>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-4 16-4.5-6.5L4 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m11.5 13.5 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
