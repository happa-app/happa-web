"use client";
// Configuración · Plazas: el admin cambia cuántas personas caben (nunca menos de las que viven ya).
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { submitWithoutReset } from "@/utils/forms";
import { saveHouseholdPlaces } from "../actions";
import { MIN_PLACES } from "../places";
import { initialPlacesState } from "../types";
import styles from "./HouseholdDetail.module.css";
import { PlacesField } from "./PlacesField";

type Props = {
  householdId: string;
  places: number;
  residents: number;
};

export function PlacesForm({ householdId, places, residents }: Props) {
  const t = useTranslations("Households");
  const [state, formAction, isPending] = useActionState(saveHouseholdPlaces, initialPlacesState);
  const [value, setValue] = useState(String(places));
  // ¿Se ha cambiado algo desde la última respuesta? (entonces no se enseña "Guardado")
  const [edited, setEdited] = useState({ state, changed: false });
  const changedSinceSave = edited.state === state && edited.changed;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.placesForm}>
      <input type="hidden" name="householdId" value={householdId} />
      <PlacesField
        label={t("places.label")}
        hint={t("places.settingsHint", { count: residents })}
        value={value}
        min={Math.max(MIN_PLACES, residents)}
        onChange={(next) => {
          setEdited({ state, changed: true });
          setValue(next);
        }}
        error={state.status === "error" && !changedSinceSave ? t(`errors.${state.error ?? "generic"}`) : undefined}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("places.saving") : t("places.save")}
      </Button>
      {state.status === "done" && !changedSinceSave ? (
        <p className={styles.saved} role="status">
          {t("places.saved")}
        </p>
      ) : null}
    </form>
  );
}
