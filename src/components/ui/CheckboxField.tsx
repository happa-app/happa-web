// Casilla con texto (que puede llevar enlaces) y mensaje de error.
import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

type Props = {
  name: string;
  label: ReactNode;
  error?: string;
  defaultChecked?: boolean;
};

export function CheckboxField({ name, label, error, defaultChecked }: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.checkboxField}>
      <div className={styles.checkboxRow}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className={styles.checkbox}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <label htmlFor={id} className={styles.checkboxLabel}>
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
