"use client";
// Configuración · Código postal: el admin lo pone, lo cambia o lo quita (dejándolo vacío).
// Solo el código postal, nunca la dirección (migración 19).
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { saveHouseholdPostalCode } from "../actions";
import { initialPostalCodeState } from "../types";
import styles from "./HouseholdDetail.module.css";

type Props = {
  householdId: string;
  postalCode: string | null;
};

export function PostalCodeForm({ householdId, postalCode }: Props) {
  const t = useTranslations("Households");
  const [state, formAction, isPending] = useActionState(saveHouseholdPostalCode, initialPostalCodeState);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.placesForm} noValidate>
      <input type="hidden" name="householdId" value={householdId} />
      <TextField
        label={t("postalCode.label")}
        name="postalCode"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={6}
        hint={t("postalCode.hint")}
        defaultValue={postalCode ?? ""}
        error={state.status === "error" ? t(`errors.${state.error ?? "generic"}`) : undefined}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("postalCode.saving") : t("postalCode.save")}
      </Button>
      {state.status === "done" ? (
        <p className={styles.saved} role="status">
          {t("postalCode.saved")}
        </p>
      ) : null}
    </form>
  );
}
