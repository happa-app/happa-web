"use client";
// "He pagado" / "Me ha pagado": abre un pequeño formulario con el importe (se puede pagar una parte).
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { paymentAction } from "../actions";
import { centsToInput } from "../money";
import { initialTriquiActionState } from "../types";
import styles from "./Triqui.module.css";

type Props = {
  householdId: string;
  // paid: tú pagas a otra persona (quedará pendiente de que lo confirme). received: te han pagado.
  intent: "paid" | "received";
  otherUserId: string;
  otherName: string;
  defaultCents: number;
  // Hoy en la zona horaria del hogar (fecha del pago)
  today: string;
};

export function PayForm({ householdId, intent, otherUserId, otherName, defaultCents, today }: Props) {
  const t = useTranslations("Triqui");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(paymentAction, initialTriquiActionState);
  const openLabel = intent === "paid" ? t("settle.iPaid") : t("settle.theyPaid");

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {openLabel}
      </Button>
    );
  }

  return (
    <form action={formAction} className={styles.payForm}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="otherUserId" value={otherUserId} />
      <input type="hidden" name="today" value={today} />
      <label className={styles.payLabel}>
        {intent === "paid" ? t("settle.howMuchPaid", { name: otherName }) : t("settle.howMuchReceived", { name: otherName })}
        <span className={styles.moneyInput}>
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={centsToInput(defaultCents, locale)}
            className={styles.input}
            required
          />
          <span aria-hidden="true">€</span>
        </span>
      </label>
      {intent === "paid" ? <p className={styles.hint}>{t("settle.paidHint", { name: otherName })}</p> : null}
      <div className={styles.buttonRow}>
        <Button type="submit" disabled={isPending}>
          {t("settle.save")}
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
