"use client";
// Añadir un dato de pago al corcho (solo adultos): para qué es, Bizum o IBAN, y el número.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { addPayment } from "../actions";
import { initialBoardFormState, MAX_LABEL, type BoardFormField } from "../schemas";
import { PAYMENT_KINDS, type PaymentKind } from "../types";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
};

export function PaymentForm({ householdId }: Props) {
  const t = useTranslations("Board");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(addPayment, initialBoardFormState);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<PaymentKind>("bizum");
  const [value, setValue] = useState("");
  const [edited, setEdited] = useState<BoardFormField[]>([]);
  const fieldError = (field: BoardFormField) => {
    const key = edited.includes(field) ? undefined : state.fieldErrors?.[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  return (
    <form
      onSubmit={(event) => {
        setEdited([]);
        submitWithoutReset(formAction)(event);
      }}
      className={styles.form}
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="kind" value={kind} />
      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <TextField
        label={t("paymentForm.label")}
        name="label"
        value={label}
        maxLength={MAX_LABEL}
        placeholder={t("paymentForm.labelPlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setEdited((f) => [...f, "label"]);
          setLabel(e.target.value);
        }}
        error={fieldError("label")}
      />

      <div className={styles.field}>
        <p className={styles.fieldLabel} id="payment-kind">
          {t("paymentForm.kind")}
        </p>
        <div className={styles.segmented} role="radiogroup" aria-labelledby="payment-kind">
          {PAYMENT_KINDS.map((k) => (
            <label key={k} className={kind === k ? styles.segmentOptionActive : styles.segmentOption}>
              <input
                type="radio"
                name="kindChoice"
                checked={kind === k}
                onChange={() => {
                  setEdited((f) => [...f, "value"]);
                  setKind(k);
                }}
                className="visually-hidden"
              />
              {t(`payments.${k}`)}
            </label>
          ))}
        </div>
      </div>

      <TextField
        label={kind === "bizum" ? t("paymentForm.bizum") : t("paymentForm.iban")}
        name="value"
        value={value}
        inputMode={kind === "bizum" ? "tel" : "text"}
        autoComplete="off"
        placeholder={kind === "bizum" ? "600 123 456" : "ES00 0000 0000 0000 0000 0000"}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setEdited((f) => [...f, "value"]);
          setValue(e.target.value);
        }}
        error={fieldError("value")}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("paymentForm.saving") : t("paymentForm.save")}
      </Button>
    </form>
  );
}
