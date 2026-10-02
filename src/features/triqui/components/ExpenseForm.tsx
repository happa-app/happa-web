"use client";
// Formulario para añadir o editar un gasto: concepto, importe, fecha, quién pagó y cómo se reparte.
// Mientras se rellena enseña lo que le toca a cada uno; al guardar, la base de datos lo vuelve a calcular.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { saveExpense } from "../actions";
import { centsToInput, formatMoney, parseAmount } from "../money";
import { splitAmount } from "../split";
import type { Expense, ExpenseFormState, SplitMethod } from "../types";
import styles from "./ExpenseForm.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  // Quién puede aparecer en el gasto (adultos del hogar; al editar, también quien ya estaba)
  people: { userId: string; name: string }[];
  today: string;
  expense?: Expense;
};

const initialState: ExpenseFormState = { status: "idle" };

// Solo cifras y un separador decimal
const moneyText = (value: string) => value.replace(/[^\d.,]/g, "").slice(0, 10);

export function ExpenseForm({ householdId, currentUserId, people, today, expense }: Props) {
  const t = useTranslations("Triqui");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveExpense, initialState);

  // Campos tocados desde la última respuesta: su error deja de verse (ya se está corrigiendo).
  // Al llegar una respuesta nueva (otro "state"), vuelve a empezar.
  type Field = keyof NonNullable<ExpenseFormState["fieldErrors"]>;
  const [edited, setEdited] = useState<{ state: ExpenseFormState; fields: Field[] }>({ state, fields: [] });
  const editedFields = edited.state === state ? edited.fields : [];
  const touch = (field: Field) => {
    if (!editedFields.includes(field)) setEdited({ state, fields: [...editedFields, field] });
  };
  const errorOf = (field: Field) => (editedFields.includes(field) ? undefined : state.fieldErrors?.[field]);

  const toInput = (cents: number) => centsToInput(cents, locale);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? toInput(expense.amountCents) : "");
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? today);
  const [multiPayer, setMultiPayer] = useState((expense?.payers.length ?? 1) > 1);
  const [payer, setPayer] = useState(expense?.payers[0]?.userId ?? currentUserId);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>(
    Object.fromEntries((expense?.payers ?? []).map((p) => [p.userId, toInput(p.amountCents)])),
  );
  const [method, setMethod] = useState<SplitMethod>(expense?.splitMethod ?? "equal");
  const [included, setIncluded] = useState<string[]>(
    expense ? expense.shares.map((s) => s.userId) : people.map((p) => p.userId),
  );
  const [weights, setWeights] = useState<Record<string, string>>(
    Object.fromEntries((expense?.shares ?? []).filter((s) => s.weight).map((s) => [s.userId, String(s.weight)])),
  );
  const [exact, setExact] = useState<Record<string, string>>(
    expense?.splitMethod === "exact" ? Object.fromEntries(expense.shares.map((s) => [s.userId, toInput(s.amountCents)])) : {},
  );

  const totalCents = parseAmount(amount);
  // "Tú" como etiqueta de fila; "tú" dentro de una frase
  const realName = (id: string) => people.find((p) => p.userId === id)?.name ?? t("someone");
  const nameOf = (id: string) => (id === currentUserId ? t("youCap") : realName(id));
  const inSentence = (id: string) => (id === currentUserId ? t("you") : realName(id));
  const inSplit = people.filter((p) => included.includes(p.userId));

  // Lo que se envía
  const payers = multiPayer
    ? people.filter((p) => (payerAmounts[p.userId] ?? "").trim()).map((p) => ({ userId: p.userId, amount: payerAmounts[p.userId] }))
    : [{ userId: payer, amount }];
  const participants = inSplit.map((p) =>
    method === "equal"
      ? { userId: p.userId }
      : method === "shares"
        ? { userId: p.userId, weight: weights[p.userId] ?? "1" }
        : { userId: p.userId, amount: exact[p.userId] ?? "" },
  );

  // Vista previa del reparto y de lo que falta por cuadrar
  const preview =
    totalCents && method !== "exact"
      ? splitAmount(
          totalCents,
          method,
          inSplit.map((p) => ({ userId: p.userId, weight: Number(weights[p.userId] ?? "1") || 0 })),
        )
      : null;
  const sumOf = (values: string[]) => values.reduce((acc, v) => acc + (parseAmount(v) ?? 0), 0);
  const payersLeft = totalCents !== null && multiPayer ? totalCents - sumOf(Object.values(payerAmounts)) : 0;
  const exactLeft = totalCents !== null && method === "exact" ? totalCents - sumOf(inSplit.map((p) => exact[p.userId] ?? "")) : 0;

  const others = [...new Set([...payers.map((p) => p.userId), ...included])].filter((id) => id !== currentUserId);

  function toggle(userId: string) {
    touch("participants");
    setIncluded((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  }

  const fieldError = (field: Field) => {
    const key = errorOf(field);
    return key ? t(`errors.${key}`) : undefined;
  };
  const leftText = (cents: number) =>
    cents > 0 ? t("form.left", { amount: formatMoney(cents, locale) }) : t("form.over", { amount: formatMoney(-cents, locale) });

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      {expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}
      {expense ? <input type="hidden" name="version" value={expense.version} /> : null}
      <input type="hidden" name="splitMethod" value={method} />
      <input type="hidden" name="payers" value={JSON.stringify(payers)} />
      <input type="hidden" name="participants" value={JSON.stringify(participants)} />

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <TextField
        label={t("form.description")}
        name="description"
        value={description}
        maxLength={80}
        placeholder={t("form.descriptionPlaceholder")}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          touch("description");
          setDescription(e.target.value);
        }}
        error={fieldError("description")}
      />

      <div className={styles.twoColumns}>
        <TextField
          label={t("form.amount")}
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
          label={t("form.date")}
          name="spentOn"
          type="date"
          value={spentOn}
          max={today}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            touch("spentOn");
            setSpentOn(e.target.value);
          }}
          error={fieldError("spentOn")}
        />
      </div>

      {/* ¿Quién pagó? */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("form.paidBy")}</legend>
        {multiPayer ? (
          <>
            <ul className={styles.people}>
              {people.map((p) => (
                <li key={p.userId} className={styles.person}>
                  <span className={styles.personName}>{nameOf(p.userId)}</span>
                  <span className={styles.money}>
                    <input
                      className={styles.smallInput}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      aria-label={t("form.paidAmountOf", { name: p.name })}
                      value={payerAmounts[p.userId] ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        touch("payers");
                        setPayerAmounts((current) => ({ ...current, [p.userId]: moneyText(e.target.value) }));
                      }}
                    />
                    €
                  </span>
                </li>
              ))}
            </ul>
            {totalCents !== null && payersLeft !== 0 ? <p className={styles.left}>{leftText(payersLeft)}</p> : null}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                touch("payers");
                setMultiPayer(false);
              }}
            >
              {t("form.onePayer")}
            </button>
          </>
        ) : (
          <>
            <select
              className={styles.select}
              value={payer}
              aria-label={t("form.paidBy")}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                touch("payers");
                setPayer(e.target.value);
              }}
            >
              {people.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {nameOf(p.userId)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                touch("payers");
                setMultiPayer(true);
              }}
            >
              {t("form.manyPayers")}
            </button>
          </>
        )}
        {fieldError("payers") ? <p className={styles.error}>{fieldError("payers")}</p> : null}
      </fieldset>

      {/* ¿Cómo se reparte? */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("form.split")}</legend>
        <div className={styles.segmented} role="radiogroup" aria-label={t("form.split")}>
          {(["equal", "shares", "exact"] as const).map((m) => (
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
                {on && method === "exact" ? (
                  <span className={styles.money}>
                    <input
                      className={styles.smallInput}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      aria-label={t("form.amountOf", { name: p.name })}
                      value={exact[p.userId] ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        touch("participants");
                        setExact((current) => ({ ...current, [p.userId]: moneyText(e.target.value) }));
                      }}
                    />
                    €
                  </span>
                ) : null}
                {on && preview && previewIndex >= 0 ? (
                  <span className={styles.share}>
                    {formatMoney(preview[previewIndex], locale)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {method === "exact" && totalCents !== null && exactLeft !== 0 ? <p className={styles.left}>{leftText(exactLeft)}</p> : null}
        {fieldError("participants") ? <p className={styles.error}>{fieldError("participants")}</p> : null}
      </fieldset>

      <p className={styles.note}>
        {others.length > 0
          ? t("form.willConfirm", { names: others.map(inSentence).join(", ") })
          : t("form.onlyYou")}
      </p>

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("form.saving") : expense ? t("form.saveChanges") : t("form.save")}
      </Button>
    </form>
  );
}
