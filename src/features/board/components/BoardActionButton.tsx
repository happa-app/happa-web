"use client";
// Un botón que hace una acción del corcho (quitar un pago, fijar o quitar una nota) con su formulario oculto.
// Si lleva confirmText, pregunta antes.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { boardAction } from "../actions";
import { initialBoardActionState } from "../schemas";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  intent: "deletePayment" | "pin" | "unpin" | "deleteNote";
  // paymentId o noteId
  fields: Record<string, string>;
  label: string;
  ariaLabel?: string;
  confirmText?: string;
};

export function BoardActionButton({ householdId, intent, fields, label, ariaLabel, confirmText }: Props) {
  const t = useTranslations("Board");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(boardAction, initialBoardActionState);

  return (
    <form
      action={formAction}
      className={styles.actionForm}
      onSubmit={(event: { preventDefault(): void }) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={styles.linkButton} disabled={isPending} aria-label={ariaLabel}>
        {label}
      </button>
      {state.status === "error" && state.error ? (
        <span className={styles.error} role="alert">
          {t(`errors.${state.error}`)}
        </span>
      ) : null}
    </form>
  );
}
