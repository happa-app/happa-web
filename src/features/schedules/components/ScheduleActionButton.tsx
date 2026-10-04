"use client";
// Botón que lanza una acción de horarios (borrar una franja o una ausencia) y enseña el error si falla.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { scheduleAction } from "../actions";
import { initialScheduleActionState } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  // Campos ocultos: householdId, intent, blockId / absenceId, personId...
  fields: Record<string, string>;
  label: string;
  // Si se indica, pide confirmación antes de enviar
  confirmText?: string;
};

export function ScheduleActionButton({ fields, label, confirmText }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(scheduleAction, initialScheduleActionState);

  return (
    <form
      action={formAction}
      className={styles.actionForm}
      onSubmit={(event: { preventDefault(): void }) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={styles.linkButton} disabled={isPending}>
        {label}
      </button>
      {state.error ? (
        <p className={styles.actionError} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}
