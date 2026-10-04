"use client";
// Formulario de una tarea: qué es, cada cuánto, desde cuándo, a quién le toca, esfuerzo y nota.
// Debajo de "cada cuánto" se ven las próximas veces que tocaría, para comprobar que es lo que quieres.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { saveChore } from "../actions";
import { addDays, isoWeekday, isValidDate, nextDates } from "../dates";
import { schedulePhrase } from "../describe";
import { formatDay } from "../format";
import { MAX_NOTES, MAX_TITLE, START_MAX_AHEAD } from "../schemas";
import {
  CHORE_ASSIGNMENTS,
  CHORE_EFFORTS,
  CHORE_FREQUENCIES,
  MAX_CHORE_INTERVAL,
  WEEKDAYS,
  type Chore,
  type ChoreAssignment,
  type ChoreEffort,
  type ChoreFormField,
  type ChoreFormState,
  type ChoreFrequency,
  type ChorePerson,
  type Weekday,
} from "../types";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  // Zona horaria del hogar y hoy en ella
  timezone: string;
  today: string;
  // Quienes viven en el hogar
  people: ChorePerson[];
  me: string;
  // Si se indica, se edita esa tarea
  chore?: Chore;
};

const initialState: ChoreFormState = { status: "idle" };
const WEEKDAYS_ONLY: Weekday[] = [1, 2, 3, 4, 5];
const INTERVALS = Array.from({ length: MAX_CHORE_INTERVAL }, (_, i) => i + 1);
const PREVIEW_COUNT = 4;

export function ChoreForm({ householdId, timezone, today, people, me, chore }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveChore, initialState);

  // Campos tocados desde la última respuesta: su error deja de verse (ya se está corrigiendo)
  const [edited, setEdited] = useState<{ state: ChoreFormState; fields: ChoreFormField[] }>({ state, fields: [] });
  const editedFields = edited.state === state ? edited.fields : [];
  const touch = (field: ChoreFormField) => {
    if (!editedFields.includes(field)) setEdited({ state, fields: [...editedFields, field] });
  };
  const fieldError = (field: ChoreFormField) => {
    const key = editedFields.includes(field) ? undefined : state.fieldErrors?.[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  const residents = new Set(people.map((p) => p.userId));
  const nameOf = (userId: string) =>
    userId === me ? t("youCap") : (people.find((p) => p.userId === userId)?.name ?? t("someone"));
  const isMinor = (userId: string) => people.find((p) => p.userId === userId)?.role === "minor";
  const hasMinors = people.some((p) => p.role === "minor");

  const [title, setTitle] = useState(chore?.title ?? "");
  const [notes, setNotes] = useState(chore?.notes ?? "");
  const [effort, setEffort] = useState<ChoreEffort>(chore?.effort ?? 2);
  const [frequency, setFrequency] = useState<ChoreFrequency>(chore?.frequency ?? "weekly");
  const [interval, setIntervalCount] = useState(chore?.interval ?? 1);
  const [days, setDays] = useState<Weekday[]>(chore?.weekdays.length ? chore.weekdays : [isoWeekday(today)]);
  const [startsOn, setStartsOn] = useState(chore?.startsOn ?? today);
  const [assignment, setAssignment] = useState<ChoreAssignment>(chore?.assignment ?? "rotation");
  const [fixedPerson, setFixedPerson] = useState(
    chore?.assigneeId && residents.has(chore.assigneeId) ? chore.assigneeId : me,
  );
  // Turnos: en orden. Al crear, todos los adultos en el orden del hogar.
  const [order, setOrder] = useState<string[]>(
    chore
      ? chore.rotation.map((r) => r.userId).filter((id) => residents.has(id))
      : people.filter((p) => p.role !== "minor").map((p) => p.userId),
  );
  const [requiresApproval, setRequiresApproval] = useState(chore?.requiresApproval ?? false);

  function toggleDay(d: Weekday) {
    touch("days");
    setDays((current) => (current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort((a, b) => a - b)));
  }
  function move(index: number, by: -1 | 1) {
    touch("people");
    setOrder((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }
  function removeFromOrder(userId: string) {
    touch("people");
    setOrder((current) => current.filter((id) => id !== userId));
  }
  function addToOrder(userId: string) {
    touch("people");
    setOrder((current) => [...current, userId]);
  }

  const peopleSent = assignment === "fixed" ? [fixedPerson] : assignment === "rotation" ? order : [];
  const repeat = { frequency, interval: frequency === "once" ? 1 : interval, weekdays: days, startsOn };
  const canPreview = isValidDate(startsOn) && (frequency !== "weekly" || days.length > 0);
  const upcoming = canPreview ? nextDates(repeat, today, PREVIEW_COUNT) : [];
  const dayLabel = (date: string) =>
    date === today ? t("today") : date === addDays(today, 1) ? t("tomorrow") : formatDay(date, locale);
  // Quién le tocaría cada vez (solo al crear: al editar, los turnos siguen por donde iban)
  const whoAt = (i: number) => {
    if (assignment === "fixed") return nameOf(fixedPerson);
    if (assignment === "rotation" && !chore && order.length > 0) return nameOf(order[i % order.length]);
    return null;
  };
  const summary = canPreview ? schedulePhrase(repeat, locale) : null;
  const unordered = people.filter((p) => !order.includes(p.userId));

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="timezone" value={timezone} />
      {chore ? <input type="hidden" name="choreId" value={chore.id} /> : null}
      {chore ? <input type="hidden" name="keepStart" value={chore.startsOn} /> : null}
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="interval" value={frequency === "once" ? 1 : interval} />
      <input type="hidden" name="effort" value={effort} />
      <input type="hidden" name="assignment" value={assignment} />
      {frequency === "weekly" ? days.map((d) => <input key={d} type="hidden" name="days" value={d} />) : null}
      {peopleSent.map((id) => (
        <input key={id} type="hidden" name="people" value={id} />
      ))}

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <TextField
        label={t("form.title")}
        name="title"
        value={title}
        maxLength={MAX_TITLE}
        placeholder={t("form.titlePlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("title");
          setTitle(e.target.value);
        }}
        error={fieldError("title")}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendTitle}>{t("form.when")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("form.when")}>
          {CHORE_FREQUENCIES.map((f) => (
            <label key={f} className={frequency === f ? styles.segmentOptionActive : styles.segmentOption}>
              <input
                type="radio"
                name="frequencyChoice"
                value={f}
                checked={frequency === f}
                onChange={() => setFrequency(f)}
                className="visually-hidden"
              />
              {t(`frequencies.${f}`)}
            </label>
          ))}
        </div>

        {frequency === "once" ? null : (
          <div className={styles.selectField}>
            <label htmlFor="chore-interval" className={styles.selectLabel}>
              {t("form.every")}
            </label>
            <select
              id="chore-interval"
              className={styles.select}
              value={interval}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setIntervalCount(Number(e.target.value))}
            >
              {INTERVALS.map((n) => (
                <option key={n} value={n}>
                  {t(`intervals.${frequency}`, { count: n })}
                </option>
              ))}
            </select>
          </div>
        )}

        {frequency === "weekly" ? (
          <div className={styles.section}>
            <p className={styles.selectLabel}>{t("form.days")}</p>
            <div className={styles.dayPicker}>
              {WEEKDAYS.map((d) => (
                <label key={d} className={days.includes(d) ? styles.dayCheckOn : styles.dayCheck} title={t(`weekdays.${d}`)}>
                  <input
                    type="checkbox"
                    className="visually-hidden"
                    checked={days.includes(d)}
                    onChange={() => toggleDay(d)}
                    aria-label={t(`weekdays.${d}`)}
                  />
                  <span aria-hidden="true">{t(`weekdaysShort.${d}`)}</span>
                </label>
              ))}
            </div>
            <div className={styles.quickRow}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  touch("days");
                  setDays(WEEKDAYS_ONLY);
                }}
              >
                {t("form.weekdaysQuick")}
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  touch("days");
                  setDays([...WEEKDAYS]);
                }}
              >
                {t("form.allDays")}
              </button>
            </div>
            {fieldError("days") ? <p className={styles.error}>{fieldError("days")}</p> : null}
          </div>
        ) : null}

        <TextField
          label={frequency === "once" ? t("form.onDay") : t("form.startsOn")}
          name="startsOn"
          type="date"
          value={startsOn}
          min={chore ? undefined : today}
          max={addDays(today, START_MAX_AHEAD)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("startsOn");
            setStartsOn(e.target.value);
          }}
          error={fieldError("startsOn")}
        />

        {summary ? (
          <p className={styles.preview}>
            <strong>{t(summary.key, summary.values)}</strong>
            <br />
            {upcoming.length > 0
              ? t("form.preview", {
                  dates: upcoming
                    .map((date, i) => {
                      const who = whoAt(i);
                      return who ? `${dayLabel(date)} (${who})` : dayLabel(date);
                    })
                    .join(" · "),
                })
              : t("form.previewNone")}
          </p>
        ) : null}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendTitle}>{t("form.who")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("form.who")}>
          {CHORE_ASSIGNMENTS.map((a) => (
            <label key={a} className={assignment === a ? styles.segmentOptionActive : styles.segmentOption}>
              <input
                type="radio"
                name="assignmentChoice"
                value={a}
                checked={assignment === a}
                onChange={() => {
                  touch("people");
                  setAssignment(a);
                }}
                className="visually-hidden"
              />
              {t(`assignments.${a}`)}
            </label>
          ))}
        </div>

        {assignment === "fixed" ? (
          <ul className={styles.people}>
            {people.map((p) => (
              <li key={p.userId} className={styles.personRow}>
                <label className={styles.personLabel}>
                  <input
                    type="radio"
                    name="fixedChoice"
                    checked={fixedPerson === p.userId}
                    onChange={() => {
                      touch("people");
                      setFixedPerson(p.userId);
                    }}
                  />
                  <span className={styles.personName}>{nameOf(p.userId)}</span>
                  {p.role === "minor" ? <span className={styles.tag}>{t("minor")}</span> : null}
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        {assignment === "rotation" ? (
          <>
            <ul className={styles.people} aria-label={t("form.rotationOrder")}>
              {order.map((userId, i) => (
                <li key={userId} className={styles.personRow}>
                  <span className={styles.position}>{i + 1}</span>
                  <span className={styles.personName}>
                    {nameOf(userId)} {isMinor(userId) ? <span className={styles.tag}>{t("minor")}</span> : null}
                  </span>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={t("form.moveUp", { name: nameOf(userId) })}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label={t("form.moveDown", { name: nameOf(userId) })}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => removeFromOrder(userId)}
                    aria-label={t("form.remove", { name: nameOf(userId) })}
                  >
                    ×
                  </button>
                </li>
              ))}
              {unordered.map((p) => (
                <li key={p.userId} className={`${styles.personRow} ${styles.personRowOff}`}>
                  <span className={`${styles.position} ${styles.positionOff}`} aria-hidden="true">
                    +
                  </span>
                  <span className={styles.personName}>
                    {nameOf(p.userId)} {p.role === "minor" ? <span className={styles.tag}>{t("minor")}</span> : null}
                  </span>
                  <button type="button" className={styles.linkButton} onClick={() => addToOrder(p.userId)}>
                    {t("form.add")}
                    <span className="visually-hidden"> {nameOf(p.userId)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{t("form.rotationHint")}</p>
          </>
        ) : null}

        {assignment === "free" ? <p className={styles.hint}>{t("form.freeHint")}</p> : null}
        {fieldError("people") ? <p className={styles.error}>{fieldError("people")}</p> : null}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendTitle}>{t("form.effort")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("form.effort")}>
          {CHORE_EFFORTS.map((e) => (
            <label key={e} className={effort === e ? styles.segmentOptionActive : styles.segmentOption}>
              <input
                type="radio"
                name="effortChoice"
                value={e}
                checked={effort === e}
                onChange={() => setEffort(e)}
                className="visually-hidden"
              />
              {t(`efforts.${e}`)}
            </label>
          ))}
        </div>
        <p className={styles.hint}>{t("form.effortHint")}</p>
      </fieldset>

      <TextField
        label={t("form.notes")}
        name="notes"
        value={notes}
        maxLength={MAX_NOTES}
        placeholder={t("form.notesPlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("notes");
          setNotes(e.target.value);
        }}
        error={fieldError("notes")}
      />

      {hasMinors || requiresApproval ? (
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            name="requiresApproval"
            checked={requiresApproval}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRequiresApproval(e.target.checked)}
          />
          <span>
            {t("form.approval")}
            <br />
            <span className={styles.hint}>{t("form.approvalHint")}</span>
          </span>
        </label>
      ) : null}

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("form.saving") : chore ? t("form.save") : t("form.create")}
      </Button>
    </form>
  );
}
