"use client";
// Formulario de una ausencia: desde qué día hasta qué día (los dos incluidos) y una nota opcional.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { saveAbsence } from "../actions";
import { MAX_NOTE } from "../schemas";
import type { Absence, AbsenceFormState } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  // De quién es la ausencia (tú o tu menor)
  personId: string;
  // Zona horaria del hogar y hoy en ella
  timezone: string;
  today: string;
  // Si se indica, se edita esa ausencia
  absence?: Absence;
};

const initialState: AbsenceFormState = { status: "idle" };

export function AbsenceForm({ householdId, personId, timezone, today, absence }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveAbsence, initialState);

  type Field = keyof NonNullable<AbsenceFormState["fieldErrors"]>;
  const [edited, setEdited] = useState<{ state: AbsenceFormState; fields: Field[] }>({ state, fields: [] });
  const editedFields = edited.state === state ? edited.fields : [];
  const touch = (field: Field) => {
    if (!editedFields.includes(field)) setEdited({ state, fields: [...editedFields, field] });
  };
  const fieldError = (field: Field) => {
    const key = editedFields.includes(field) ? undefined : state.fieldErrors?.[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  const [startsOn, setStartsOn] = useState(absence?.startsOn ?? today);
  const [endsOn, setEndsOn] = useState(absence?.endsOn ?? today);
  const [note, setNote] = useState(absence?.note ?? "");

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="timezone" value={timezone} />
      {absence ? <input type="hidden" name="absenceId" value={absence.id} /> : null}

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <div className={styles.twoColumns}>
        <TextField
          label={t("absenceForm.startsOn")}
          name="startsOn"
          type="date"
          value={startsOn}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("startsOn");
            const value = e.target.value;
            setStartsOn(value);
            // Si la vuelta queda antes de la ida, se mueve con ella
            if (value && endsOn < value) setEndsOn(value);
          }}
          error={fieldError("startsOn")}
        />
        <TextField
          label={t("absenceForm.endsOn")}
          name="endsOn"
          type="date"
          value={endsOn}
          min={startsOn || today}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("endsOn");
            setEndsOn(e.target.value);
          }}
          error={fieldError("endsOn")}
        />
      </div>

      <TextField
        label={t("absenceForm.note")}
        name="note"
        value={note}
        maxLength={MAX_NOTE}
        placeholder={t("absenceForm.notePlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("note");
          setNote(e.target.value);
        }}
        error={fieldError("note")}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("form.saving") : absence ? t("form.save") : t("absenceForm.save")}
      </Button>
    </form>
  );
}
