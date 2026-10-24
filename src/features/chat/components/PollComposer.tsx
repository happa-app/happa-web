"use client";
// Formulario para crear una votación: la pregunta, de 2 a 10 opciones y dos interruptores (varias respuestas
// y si votan los menores). Sale abajo, en el sitio de la caja de escribir. La base de datos vuelve a
// comprobarlo todo (migración 21).
import { useTranslations } from "next-intl";
import { useState } from "react";
import { POLL_OPTION_MAX, POLL_OPTIONS_MAX, POLL_OPTIONS_MIN, POLL_QUESTION_MAX } from "../types";
import styles from "./Chat.module.css";

type Props = {
  onCreate: (poll: { question: string; options: string[]; multiple: boolean; minorsCanVote: boolean }) => Promise<boolean>;
  onCancel: () => void;
};

export function PollComposer({ onCreate, onCancel }: Props) {
  const t = useTranslations("Chat.poll");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);
  const [minorsCanVote, setMinorsCanVote] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<"question" | "options" | "repeated" | null>(null);

  function setOption(index: number, value: string) {
    setOptions((list) => list.map((o, i) => (i === index ? value : o)));
  }

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const q = question.trim();
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (!q) return setProblem("question");
    if (filled.length < POLL_OPTIONS_MIN) return setProblem("options");
    if (new Set(filled.map((o) => o.toLowerCase())).size !== filled.length) return setProblem("repeated");
    setProblem(null);
    setSending(true);
    const ok = await onCreate({ question: q, options: filled, multiple, minorsCanVote });
    setSending(false);
    if (ok) onCancel();
  }

  return (
    <form className={`${styles.composer} ${styles.pollForm}`} onSubmit={submit} noValidate>
      <p className={styles.pollFormTitle}>{t("newTitle")}</p>

      <label className={styles.pollField}>
        <span className={styles.pollFieldLabel}>{t("question")}</span>
        <input
          className={styles.pollInput}
          value={question}
          maxLength={POLL_QUESTION_MAX}
          placeholder={t("questionPlaceholder")}
          onChange={(e) => setQuestion(e.target.value)}
          aria-invalid={problem === "question" ? true : undefined}
          autoFocus
        />
      </label>

      <fieldset className={styles.pollField}>
        <legend className={styles.pollFieldLabel}>{t("options")}</legend>
        {options.map((option, index) => (
          <div key={index} className={styles.pollOptionInput}>
            <input
              className={styles.pollInput}
              value={option}
              maxLength={POLL_OPTION_MAX}
              placeholder={t("optionPlaceholder", { number: index + 1 })}
              aria-label={t("optionPlaceholder", { number: index + 1 })}
              onChange={(e) => setOption(index, e.target.value)}
            />
            {options.length > POLL_OPTIONS_MIN ? (
              <button
                type="button"
                className={styles.pollRemove}
                onClick={() => setOptions((list) => list.filter((_, i) => i !== index))}
                aria-label={t("removeOption", { number: index + 1 })}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        {options.length < POLL_OPTIONS_MAX ? (
          <button type="button" className={styles.linkButton} onClick={() => setOptions((list) => [...list, ""])}>
            + {t("addOption")}
          </button>
        ) : null}
      </fieldset>

      <label className={styles.pollToggle}>
        <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />
        {t("allowMultiple")}
      </label>
      <label className={styles.pollToggle}>
        <input type="checkbox" checked={minorsCanVote} onChange={(e) => setMinorsCanVote(e.target.checked)} />
        {t("allowMinors")}
      </label>

      {problem ? (
        <p className={styles.pollProblem} role="alert">
          {t(`problems.${problem}`)}
        </p>
      ) : null}

      <div className={styles.pollActions}>
        <button type="button" className={styles.pollCancel} onClick={onCancel} disabled={sending}>
          {t("cancel")}
        </button>
        <button type="submit" className={styles.pollSubmit} disabled={sending}>
          {sending ? t("sending") : t("send")}
        </button>
      </div>
    </form>
  );
}
