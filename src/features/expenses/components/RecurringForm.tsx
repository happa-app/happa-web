"use client";
// Formulario de un gasto fijo: concepto, importe de cada cargo, cada cuánto, primer cargo, quién paga
// y entre quiénes se reparte. Enseña lo que le toca a cada uno en cada cargo.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { saveRecurring } from "../actions";
import { centsToInput, formatMoney, parseAmount } from "../money";
import { addDays, RECURRING_START_MAX_DAYS, RECURRING_START_MIN_DAYS } from "../dates";
import { splitAmount } from "../split";
import {
  FREQUENCIES,
  RECURRING_SPLIT_METHODS,
  type Frequency,
  type RecurringExpense,
  type RecurringFormState,
  type RecurringSplitMethod,
} from "../types";
import styles from "./ExpenseForm.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  // Adultos que viven ahora en el hogar (solo ellos pueden pagar o entrar en el reparto)
  people: { userId: string; name: string }[];
  // Hoy en la zona horaria del hogar
  today: string;
  recurring?: RecurringExpense;
};

const initialState: RecurringFormState = { status: "idle" };

// Solo cifras y un separador decimal
const moneyText = (value: string) => value.replace(/[^\d.,]/g, "").slice(0, 10);

export function RecurringForm({ householdId, currentUserId, people, today, recurring }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveRecurring, initialState);

  // Campos tocados desde la última respuesta: su error deja de verse (ya se está corrigiendo)
  type Field = keyof NonNullable<RecurringFormState["fieldErrors"]>;
  const [edited, setEdited] = useState<{ state: RecurringFormState; fields: Field[] }>({ state, fields: [] });
  const editedFields = edited.state === state ? edited.fields : [];
  const touch = (field: Field) => {
    if (!editedFields.includes(field)) setEdited({ state, fields: [...editedFields, field] });
  };
  const errorOf = (field: Field) => (editedFields.includes(field) ? undefined : state.fieldErrors?.[field]);
  const fieldError = (field: Field) => {
    const key = errorOf(field);
    return key ? t(`errors.${key}`) : undefined;
  };

  const peopleIds = people.map((p) => p.userId);
  // Con cargos ya apuntados no se puede cambiar cuándo se cobra
  const scheduleLocked = recurring?.hasCharges ?? false;

  const [description, setDescription] = useState(recurring?.description ?? "");
  const [amount, setAmount] = useState(recurring ? centsToInput(recurring.amountCents, locale) : "");
  const [frequency, setFrequency] = useState<Frequency>(recurring?.frequency ?? "monthly");
  const [startsOn, setStartsOn] = useState(recurring?.startsOn ?? today);
  // Si quien pagaba ya no vive aquí, hay que elegir a otra persona
  const [paidBy, setPaidBy] = useState(
    recurring && peopleIds.includes(recurring.paidBy) ? recurring.paidBy : currentUserId,
  );
  const [method, setMethod] = useState<RecurringSplitMethod>(recurring?.splitMethod ?? "equal");
  const [included, setIncluded] = useState<string[]>(
    recurring ? recurring.shares.map((s) => s.userId).filter((id) => peopleIds.includes(id)) : peopleIds,
  );
  const [weights, setWeights] = useState<Record<string, string>>(
    Object.fromEntries((recurring?.shares ?? []).filter((s) => s.weight).map((s) => [s.userId, String(s.weight)])),
  );

  const totalCents = parseAmount(amount);
  const realName = (id: string) => people.find((p) => p.userId === id)?.name ?? t("someone");
  const nameOf = (id: string) => (id === currentUserId ? t("youCap") : realName(id));
  const inSentence = (id: string) => (id === currentUserId ? t("you") : realName(id));
  const inSplit = people.filter((p) => included.includes(p.userId));

  const participants = inSplit.map((p) =>
    method === "equal" ? { userId: p.userId } : { userId: p.userId, weight: weights[p.userId] ?? "1" },
  );
  const preview = totalCents
    ? splitAmount(
        totalCents,
        method,
        inSplit.map((p) => ({ userId: p.userId, weight: Number(weights[p.userId] ?? "1") || 0 })),
      )
    : null;
  const others = [...new Set([paidBy, ...included])].filter((id) => id !== currentUserId);
  const newcomers = others.filter((id) => !recurring?.confirmedBy.includes(id));

  function toggle(userId: string) {
    touch("participants");
    setIncluded((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="today" value={today} />
      {recurring ? <input type="hidden" name="recurringId" value={recurring.id} /> : null}
      {recurring ? <input type="hidden" name="version" value={recurring.version} /> : null}
      {/* Al editar, si el primer cargo no cambia no se vuelve a comprobar (puede ser de hace tiempo) */}
      {recurring ? <input type="hidden" name="keepStart" value={recurring.startsOn} /> : null}
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="splitMethod" value={method} />
      <input type="hidden" name="paidBy" value={paidBy} />
      <input type="hidden" name="participants" value={JSON.stringify(participants)} />

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <TextField
        label={t("form.description")}
        name="description"
        value={description}
        maxLength={80}
        placeholder={t("recurring.form.descriptionPlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("description");
          setDescription(e.target.value);
        }}
        error={fieldError("description")}
      />

      <div className={styles.twoColumns}>
        <TextField
          label={t("recurring.form.amount")}
          name="amount"
          value={amount}
          inputMode="decimal"
          placeholder="0,00"
          autoComplete="off"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("amount");
            setAmount(moneyText(e.target.value));
          }}
          error={fieldError("amount")}
        />
        <TextField
          label={t("recurring.form.startsOn")}
          name="startsOn"
          type="date"
          value={startsOn}
          min={scheduleLocked ? undefined : addDays(today, RECURRING_START_MIN_DAYS)}
          max={scheduleLocked ? undefined : addDays(today, RECURRING_START_MAX_DAYS)}
          readOnly={scheduleLocked}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("startsOn");
            setStartsOn(e.target.value);
          }}
          error={fieldError("startsOn")}
        />
      </div>

      {/* ¿Cada cuánto? */}
      <fieldset className={styles.fieldset} disabled={scheduleLocked}>
        <legend className={styles.legend}>{t("recurring.form.frequency")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("recurring.form.frequency")}>
          {FREQUENCIES.map((f) => (
            <label key={f} className={frequency === f ? styles.segmentActive : styles.segment}>
              <input
                type="radio"
                name="frequencyChoice"
                value={f}
                checked={frequency === f}
                onChange={() => setFrequency(f)}
                className="visually-hidden"
              />
              {t(`recurring.frequency.${f}`)}
            </label>
          ))}
        </div>
        <p className={styles.note}>
          {scheduleLocked ? t("recurring.form.scheduleLocked") : t("recurring.form.startsOnHint")}
        </p>
      </fieldset>

      {/* ¿Quién lo paga? */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("recurring.form.paidBy")}</legend>
        <select
          className={styles.select}
          value={paidBy}
          aria-label={t("recurring.form.paidBy")}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            touch("paidBy");
            setPaidBy(e.target.value);
          }}
        >
          {people.map((p) => (
            <option key={p.userId} value={p.userId}>
              {nameOf(p.userId)}
            </option>
          ))}
        </select>
        {fieldError("paidBy") ? <p className={styles.error}>{fieldError("paidBy")}</p> : null}
      </fieldset>

      {/* ¿Entre quiénes? */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("recurring.form.split")}</legend>
        <div className={styles.segmentedTwo} role="radiogroup" aria-label={t("recurring.form.split")}>
          {RECURRING_SPLIT_METHODS.map((m) => (
            <label key={m} className={method === m ? styles.segmentActive : styles.segment}>
              <input
                type="radio"
                name="splitMethodChoice"
                value={m}
                checked={method === m}
                onChange={() => {
                  touch("participants");
                  setMethod(m);
                }}
                className="visually-hidden"
              />
              {t(`methods.${m}`)}
            </label>
          ))}
        </div>

        <ul className={styles.people}>
          {people.map((p) => {
            const on = included.includes(p.userId);
            const previewIndex = inSplit.findIndex((x) => x.userId === p.userId);
            return (
              <li key={p.userId} className={on ? styles.person : styles.personOff}>
                <label className={styles.check}>
                  <input type="checkbox" checked={on} onChange={() => toggle(p.userId)} />
                  <span className={styles.personName}>{nameOf(p.userId)}</span>
                </label>
                {on && method === "shares" ? (
                  <input
                    className={styles.tinyInput}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={t("form.partsOf", { name: p.name })}
                    value={weights[p.userId] ?? "1"}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      touch("participants");
                      setWeights((current) => ({ ...current, [p.userId]: e.target.value.replace(/\D/g, "").slice(0, 2) }));
                    }}
                  />
                ) : null}
                {on && preview && previewIndex >= 0 ? (
                  <span className={styles.share}>{formatMoney(preview[previewIndex], locale)}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {preview ? <p className={styles.note}>{t("recurring.form.perCharge")}</p> : null}
        {fieldError("participants") ? <p className={styles.error}>{fieldError("participants")}</p> : null}
      </fieldset>

      <p className={styles.note}>
        {recurring?.everConfirmed
          ? // Ya se confirmó alguna vez (edita un admin): solo tendrá que confirmar quien entre nuevo
            newcomers.length > 0
            ? t("recurring.form.newcomersConfirm", { names: newcomers.map(inSentence).join(", ") })
            : t("recurring.form.staysConfirmed")
          : others.length > 0
            ? t("recurring.form.willConfirm", {
                names: others.map(inSentence).join(", "),
                every: t(`recurring.every.${frequency}`),
              })
            : t("recurring.form.onlyYou", { every: t(`recurring.every.${frequency}`) })}
      </p>

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("form.saving") : recurring ? t("form.saveChanges") : t("recurring.form.save")}
      </Button>
    </form>
  );
}
