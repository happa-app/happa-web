"use client";
// Rechazar un gasto, con un motivo opcional para que quien lo creó sepa qué corregir.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { expenseAction } from "../actions";
import { initialTriquiActionState } from "../types";
import styles from "./Triqui.module.css";

type Props = { householdId: string; expenseId: string; version: number };

export function RejectForm({ householdId, expenseId, version }: Props) {
  const t = useTranslations("Triqui");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(expenseAction, initialTriquiActionState);

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
      <input type="hidden" name="expenseId" value={expenseId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="intent" value="reject" />
      <label className={styles.payLabel}>
        {t("detail.rejectReason")}
        <textarea name="reason" maxLength={200} rows={2} className={styles.textarea} placeholder={t("detail.rejectPlaceholder")} />
      </label>
      <div className={styles.buttonRow}>
        <Button type="submit" disabled={isPending}>
          {t("detail.rejectSubmit")}
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
