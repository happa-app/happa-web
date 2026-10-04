"use client";
// Formulario de una franja del horario. Al añadir se pueden elegir varios días a la vez (la misma franja
// en cada uno); al editar, un solo día.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { saveBlock } from "../actions";
import { MAX_LABEL } from "../schemas";
import { SCHEDULE_KINDS, WEEKDAYS, type BlockFormState, type ScheduleBlock, type ScheduleKind, type Weekday } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  // De quién es el horario (tú o tu menor)
  personId: string;
  // Si se indica, se edita esa franja
  block?: ScheduleBlock;
};

const initialState: BlockFormState = { status: "idle" };
const WEEKDAYS_ONLY: Weekday[] = [1, 2, 3, 4, 5];

export function BlockForm({ householdId, personId, block }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveBlock, initialState);

  // Campos tocados desde la última respuesta: su error deja de verse (ya se está corrigiendo)
  type Field = keyof NonNullable<BlockFormState["fieldErrors"]>;
  const [edited, setEdited] = useState<{ state: BlockFormState; fields: Field[] }>({ state, fields: [] });
  const editedFields = edited.state === state ? edited.fields : [];
  const touch = (field: Field) => {
    if (!editedFields.includes(field)) setEdited({ state, fields: [...editedFields, field] });
  };
  const fieldError = (field: Field) => {
    const key = editedFields.includes(field) ? undefined : state.fieldErrors?.[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  const editing = Boolean(block);
  const [days, setDays] = useState<Weekday[]>(block ? [block.weekday] : []);
  const [startsAt, setStartsAt] = useState(block?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(block?.endsAt ?? "");
  const [kind, setKind] = useState<ScheduleKind>(block?.kind ?? "class");
  const [label, setLabel] = useState(block?.label ?? "");

  function toggleDay(d: Weekday) {
    touch("days");
    if (editing) setDays([d]);
    else setDays((current) => (current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort((a, b) => a - b)));
  }
  function setQuick(list: Weekday[]) {
    touch("days");
    setDays(list);
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="personId" value={personId} />
      {block ? <input type="hidden" name="blockId" value={block.id} /> : null}
      <input type="hidden" name="kind" value={kind} />
      {days.map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendTitle}>{editing ? t("form.day") : t("form.days")}</legend>
        <div className={styles.dayPicker}>
          {WEEKDAYS.map((d) => (
            <label key={d} className={days.includes(d) ? styles.dayCheckOn : styles.dayCheck} title={t(`weekdays.${d}`)}>
              <input
                type={editing ? "radio" : "checkbox"}
                name="dayChoice"
                className="visually-hidden"
                checked={days.includes(d)}
                onChange={() => toggleDay(d)}
                aria-label={t(`weekdays.${d}`)}
              />
              <span aria-hidden="true">{t(`weekdaysShort.${d}`)}</span>
            </label>
          ))}
        </div>
        {editing ? null : (
          <div className={styles.quickRow}>
            <button type="button" className={styles.linkButton} onClick={() => setQuick(WEEKDAYS_ONLY)}>
              {t("form.weekdaysQuick")}
            </button>
            <button type="button" className={styles.linkButton} onClick={() => setQuick([...WEEKDAYS])}>
              {t("form.allDays")}
            </button>
          </div>
        )}
        {fieldError("days") ? <p className={styles.error}>{fieldError("days")}</p> : null}
      </fieldset>

      <div className={styles.twoColumns}>
        <TextField
          label={t("form.startsAt")}
          name="startsAt"
          type="time"
          step={300}
          value={startsAt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("startsAt");
            setStartsAt(e.target.value);
          }}
          error={fieldError("startsAt")}
        />
        <TextField
          label={t("form.endsAt")}
          name="endsAt"
          type="time"
          step={300}
          value={endsAt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("endsAt");
            setEndsAt(e.target.value);
          }}
          error={fieldError("endsAt")}
        />
      </div>
      <p className={styles.hint}>{t("form.midnightHint")}</p>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendTitle}>{t("form.kind")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("form.kind")}>
          {SCHEDULE_KINDS.map((k) => (
            <label key={k} className={kind === k ? styles.segmentOptionActive : styles.segmentOption}>
              <input
                type="radio"
                name="kindChoice"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="visually-hidden"
              />
              <span className={`${styles.swatch} ${styles[`kind_${k}`]}`} aria-hidden="true" />
              {t(`kinds.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <TextField
        label={t("form.label")}
        name="label"
        value={label}
        maxLength={MAX_LABEL}
        placeholder={t("form.labelPlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("label");
          setLabel(e.target.value);
        }}
        error={fieldError("label")}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("form.saving") : editing ? t("form.save") : t("form.add", { count: Math.max(days.length, 1) })}
      </Button>
    </form>
  );
}
