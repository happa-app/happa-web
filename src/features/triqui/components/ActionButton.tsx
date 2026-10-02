"use client";
// Botón que lanza una acción del triqui (confirmar, borrar, dar por bueno...) y enseña el error si falla.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { expenseAction, paymentAction } from "../actions";
import { initialTriquiActionState } from "../types";
import styles from "./Triqui.module.css";

type Props = {
  kind: "expense" | "payment";
  // Campos ocultos del formulario: householdId, expenseId / paymentId, intent...
  fields: Record<string, string>;
  label: string;
  variant?: "primary" | "secondary";
  // Si se indica, pide confirmación antes de enviar
  confirmText?: string;
  fullWidth?: boolean;
};

export function ActionButton({ kind, fields, label, variant = "secondary", confirmText, fullWidth = false }: Props) {
  const t = useTranslations("Triqui");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    kind === "expense" ? expenseAction : paymentAction,
    initialTriquiActionState,
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
