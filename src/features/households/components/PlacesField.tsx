"use client";
// Campo de plazas: un número con botones − y + (cómodo en el móvil). También se puede escribir.
import { useTranslations } from "next-intl";
import { useId, type ChangeEvent } from "react";
import { MAX_PLACES, stepPlaces } from "../places";
import styles from "./PlacesField.module.css";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Mínimo que se puede elegir (por ejemplo, las personas que ya viven en el hogar)
  min: number;
  hint?: string;
  error?: string;
};

export function PlacesField({ label, value, onChange, min, hint, error }: Props) {
  const t = useTranslations("Households.places");
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const current = Number(value);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          aria-label={t("less")}
          aria-controls={id}
          disabled={Number.isFinite(current) && current <= min}
          onClick={() => onChange(String(stepPlaces(value, -1, min, MAX_PLACES)))}
        >
          −
        </button>
        <input
          id={id}
          name="places"
          type="number"
          inputMode="numeric"
          min={min}
          max={MAX_PLACES}
          step={1}
          className={styles.input}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        />
        <button
          type="button"
          className={styles.stepButton}
          aria-label={t("more")}
          aria-controls={id}
          disabled={Number.isFinite(current) && current >= MAX_PLACES}
          onClick={() => onChange(String(stepPlaces(value, 1, min, MAX_PLACES)))}
        >
          +
        </button>
      </div>
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
