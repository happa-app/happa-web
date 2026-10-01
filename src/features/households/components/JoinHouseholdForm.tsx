"use client";
// Unirse a un hogar. Dos modos:
//  · sin "code": campo para escribir o pegar el código o el enlace.
//  · con "code": viene de un enlace de invitación; solo muestra el botón de confirmar.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { joinHousehold } from "../actions";
import { firstFieldError, initialHouseholdState } from "../types";
import styles from "./HouseholdForms.module.css";

type Props = {
  code?: string;
  householdName?: string;
};

export function JoinHouseholdForm({ code, householdName }: Props) {
  const t = useTranslations("Households");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(joinHousehold, initialHouseholdState);
  const codeError = firstFieldError(state, "code");

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}
      <input type="hidden" name="locale" value={locale} />

      {code ? (
        <input type="hidden" name="code" value={code} />
      ) : (
        <TextField
          label={t("join.code")}
          name="code"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          hint={t("join.codeHint")}
          defaultValue={state.values?.code}
          error={codeError ? t(`errors.${codeError}`) : undefined}
        />
      )}

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending
          ? t("join.submitting")
          : householdName
            ? t("preview.submit", { name: householdName })
            : t("join.submit")}
      </Button>
    </form>
  );
}
