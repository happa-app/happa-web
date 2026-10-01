// Aviso dentro de un formulario: error general o mensaje de éxito.
import type { ReactNode } from "react";
import styles from "./Alert.module.css";

type Props = {
  tone: "error" | "success";
  title?: string;
  children: ReactNode;
};

export function Alert({ tone, title, children }: Props) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === "error" ? "alert" : "status"}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
