"use client";
// «Clavar una nota»: plegado tras un botón. Los adultos pueden marcarla como norma (se queda fijada arriba).
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { submitWithoutReset } from "@/utils/forms";
import { boardAction } from "../actions";
import { initialBoardActionState, MAX_NOTE, type BoardActionState } from "../schemas";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  isAdult: boolean;
};

export function NoteForm({ householdId, isAdult }: Props) {
  const t = useTranslations("Board");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  // Clavada: se vacía y se pliega otra vez. Si falla, lo escrito se queda (submitWithoutReset).
  // Se hace al volver la acción (no en un useEffect, que pintaría la pantalla dos veces).
  const [state, formAction, isPending] = useActionState(
    async (prev: BoardActionState, formData: FormData) => {
      const result = await boardAction(prev, formData);
      if (result.status === "done") {
        setBody("");
        setOpen(false);
      }
      return result;
    },
    initialBoardActionState,
  );

  if (!open) {
    return (
      <Button type="button" fullWidth onClick={() => setOpen(true)}>
        {t("notes.add")}
      </Button>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.noteForm}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="intent" value="addNote" />
      <label htmlFor="board-note" className="visually-hidden">
        {t("notes.label")}
      </label>
      <textarea
        id="board-note"
        name="body"
        className={styles.textarea}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_NOTE}
        placeholder={t("notes.placeholder")}
        required
        autoFocus
        aria-invalid={state.status === "error" ? true : undefined}
      />
      {isAdult ? (
        <label className={styles.check}>
          <input type="checkbox" name="pinned" />
          {t("notes.isRule")}
        </label>
      ) : null}
      {state.status === "error" && state.error ? (
        <p className={styles.error} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      <div className={styles.formButtons}>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("notes.saving") : t("notes.save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          {t("notes.cancel")}
        </Button>
      </div>
    </form>
  );
}
