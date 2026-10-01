// Tarjeta blanca con sombra suave: el contenedor básico de las pantallas de la app.
import type { ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  title?: string;
  children: ReactNode;
};

export function Card({ title, children }: Props) {
  return (
    <section className={styles.card}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {children}
    </section>
  );
}
