"use client";
// Rechazar un gasto o un gasto fijo, con un motivo opcional para que quien lo creó sepa qué corregir.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { expenseAction, recurringAction } from "../actions";
import { initialExpensesActionState } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  // id del gasto o del gasto fijo (según kind)
  targetId: string;
  version: number;
  kind?: "expense" | "recurring";
};

export function RejectForm({ householdId, targetId, version, kind = "expense" }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    kind === "expense" ? expenseAction : recurringAction,
    initialExpensesActionState,
  );

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {t("detail.reject")}
      </Button>
    );
  }

  return (
    <form action={formAction} className={styles.payForm}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name={kind === "expense" ? "expenseId" : "recurringId"} value={targetId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="intent" value="reject" />
      <label className={styles.payLabel}>
        {t("detail.rejectReason")}
        <textarea name="reason" maxLength={200} rows={2} className={styles.textarea} placeholder={kind === "expense" ? t("detail.rejectPlaceholder") : t("recurring.rejectPlaceholder")} />
      </label>
      <div className={styles.buttonRow}>
        <Button type="submit" disabled={isPending}>
          {kind === "expense" ? t("detail.rejectSubmit") : t("recurring.rejectSubmit")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
      {state.error ? (
        <p className={styles.actionError} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}
