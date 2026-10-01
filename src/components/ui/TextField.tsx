// Campo de texto con etiqueta, ayuda y error, accesible para lectores de pantalla.
import { useId, type InputHTMLAttributes } from "react";
import styles from "./Field.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, name, hint, error, ...inputProps }: Props) {
  const id = useId();
  // Si hay error, se muestra el error en lugar de la ayuda.
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
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
