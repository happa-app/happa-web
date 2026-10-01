// Botón base de la app. Úsalo en lugar de <button> para que todos se vean igual.
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth = false, className, ...props }: Props) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
