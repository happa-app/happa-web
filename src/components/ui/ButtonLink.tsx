// Enlace con aspecto de botón (para navegar, no para enviar formularios).
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./Button.module.css";

type Props = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  // sm: píldora pequeña para acciones dentro de una fila
  size?: "md" | "sm";
};

export function ButtonLink({ variant = "primary", fullWidth = false, size = "md", className, ...props }: Props) {
  const classes = [styles.button, styles[variant], size === "sm" && styles.sm, fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");
  return <Link className={classes} {...props} />;
}
