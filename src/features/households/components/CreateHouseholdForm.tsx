"use client";
// Formulario para crear un hogar: nombre, tipo y cuántas personas caben. Quien lo crea queda como admin.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { createHousehold } from "../actions";
import { defaultPlaces, MIN_PLACES } from "../places";
import { firstFieldError, HOUSEHOLD_KINDS, initialHouseholdState } from "../types";
import styles from "./HouseholdForms.module.css";
import { PlacesField } from "./PlacesField";

export function CreateHouseholdForm() {
  const t = useTranslations("Households");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(createHousehold, initialHouseholdState);

  const nameError = firstFieldError(state, "name");
  const kindError = firstFieldError(state, "kind");
  const placesError = firstFieldError(state, "places");

  // Las plazas se ponen solas según el tipo (pareja 2, familia 6, pisos 4) hasta que las cambias tú
  const [places, setPlaces] = useState(state.values?.places ?? String(defaultPlaces(state.values?.kind)));
  const [placesTouched, setPlacesTouched] = useState(Boolean(state.values?.places));

  return (
    // Sin que React vacíe el formulario al volver con un error (las plazas las guarda React)
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
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
                onChange={() => {
                  if (!placesTouched) setPlaces(String(defaultPlaces(kind)));
                }}
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

      <PlacesField
        label={t("places.label")}
        hint={t("places.createHint")}
        value={places}
        min={MIN_PLACES}
        onChange={(value) => {
          setPlacesTouched(true);
          setPlaces(value);
        }}
        error={placesError ? t(`errors.${placesError}`) : undefined}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("create.submitting") : t("create.submit")}
      </Button>
    </form>
  );
}
