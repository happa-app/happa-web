"use client";
// Botón que lanza una acción de gastos (confirmar, borrar, dar por bueno...) y enseña el error si falla.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { expenseAction, paymentAction, recurringAction } from "../actions";
import { initialExpensesActionState } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  kind: "expense" | "payment" | "recurring";
  // Campos ocultos del formulario: householdId, expenseId / paymentId / recurringId, intent...
  fields: Record<string, string>;
  label: string;
  variant?: "primary" | "secondary";
  // Si se indica, pide confirmación antes de enviar
  confirmText?: string;
  fullWidth?: boolean;
};

export function ActionButton({ kind, fields, label, variant = "secondary", confirmText, fullWidth = false }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    kind === "expense" ? expenseAction : kind === "payment" ? paymentAction : recurringAction,
    initialExpensesActionState,
  );

  return (
    <form
      action={formAction}
      className={fullWidth ? styles.actionFormFull : styles.actionForm}
      onSubmit={(event: { preventDefault(): void }) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant={variant} disabled={isPending} fullWidth={fullWidth}>
        {label}
      </Button>
      {state.error ? (
        <p className={styles.actionError} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}
