// Botón base de la app. Úsalo en lugar de <button> para que todos se vean igual.
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

// (ComponentProps incluye "ref": en React 19 se pasa como una prop más)
type Props = ComponentProps<"button"> & {
  // danger: para lo que no se puede deshacer (borrar la cuenta)
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth = false, className, ...props }: Props) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
