// Enlace con aspecto de botón (para navegar, no para enviar formularios).
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./Button.module.css";

type Props = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
};

export function ButtonLink({ variant = "primary", fullWidth = false, className, ...props }: Props) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");
  return <Link className={classes} {...props} />;
}
