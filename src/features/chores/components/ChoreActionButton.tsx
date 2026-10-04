"use client";
// Botón que lanza una acción de tareas (hecha, no está hecha, visto bueno, me la quedo, borrar...)
// y enseña el error si falla. Tres aspectos: el redondo de "hecha", un botón normal o un enlace.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { choreAction } from "../actions";
import { initialChoreActionState } from "../types";
import styles from "./Chores.module.css";

type Props = {
  // Campos ocultos: householdId, intent, dayId / choreId...
  fields: Record<string, string>;
  label: string;
  look?: "check" | "primary" | "secondary" | "link";
  // Si se indica, pide confirmación antes de enviar
  confirmText?: string;
  fullWidth?: boolean;
};

export function ChoreActionButton({ fields, label, look = "link", confirmText, fullWidth = false }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(choreAction, initialChoreActionState);

  const formClass = look === "check" ? styles.checkForm : fullWidth ? styles.actionFormFull : styles.actionForm;
  return (
    <form
      action={formAction}
      className={formClass}
      onSubmit={(event: { preventDefault(): void }) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {look === "check" ? (
        <button
          type="submit"
          className={isPending ? `${styles.check} ${styles.checkPending}` : styles.check}
          disabled={isPending}
          aria-label={label}
          title={label}
        >
          <span className={styles.checkCircle}>
            <CheckMark />
          </span>
        </button>
      ) : look === "link" ? (
        <button type="submit" className={styles.linkButton} disabled={isPending}>
          {label}
        </button>
      ) : (
        <Button type="submit" variant={look} disabled={isPending} fullWidth={fullWidth}>
          {label}
        </Button>
      )}
      {state.error ? (
        <p className={styles.actionError} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}

export function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
