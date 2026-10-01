"use client";
// Formulario para crear un hogar: nombre y tipo. Quien lo crea queda como admin.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { createHousehold } from "../actions";
import { firstFieldError, HOUSEHOLD_KINDS, initialHouseholdState } from "../types";
import styles from "./HouseholdForms.module.css";

export function CreateHouseholdForm() {
  const t = useTranslations("Households");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(createHousehold, initialHouseholdState);

  const nameError = firstFieldError(state, "name");
  const kindError = firstFieldError(state, "kind");

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}
      <input type="hidden" name="locale" value={locale} />

      <TextField
        label={t("create.name")}
        name="name"
        maxLength={80}
        required
        placeholder={t("create.namePlaceholder")}
        defaultValue={state.values?.name}
        error={nameError ? t(`errors.${nameError}`) : undefined}
      />

      <fieldset
        className={styles.fieldset}
        aria-invalid={kindError ? true : undefined}
        aria-describedby={kindError ? "kind-error" : undefined}
      >
        <legend className={styles.legend}>{t("create.kind")}</legend>
        <div className={styles.options}>
          {HOUSEHOLD_KINDS.map((kind) => (
            <label key={kind} className={styles.option}>
              <input
                type="radio"
                name="kind"
                value={kind}
                defaultChecked={state.values?.kind === kind}
                className={styles.radio}
              />
              <span className={styles.optionText}>
                <span className={styles.optionTitle}>{t(`kinds.${kind}`)}</span>
                <span className={styles.optionDescription}>{t(`kindDescriptions.${kind}`)}</span>
              </span>
            </label>
          ))}
        </div>
        {kindError ? (
          <p id="kind-error" className={styles.error}>
            {t(`errors.${kindError}`)}
          </p>
        ) : null}
      </fieldset>

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("create.submitting") : t("create.submit")}
      </Button>
    </form>
  );
}
