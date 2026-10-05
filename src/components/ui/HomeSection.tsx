// Una parte de la página del hogar (Inicio): título con su icono, "Ver todo" (lleva a su página) y
// debajo un resumen más completo que una tarjeta (gastos, horarios, tareas).
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./HomeSection.module.css";

type Props = {
  title: string;
  icon: ReactNode;
  href: string;
  // "Ver todo" y, para lectores de pantalla, "Ver todo de Gastos"
  linkLabel: string;
  linkAriaLabel: string;
  children: ReactNode;
};

export function HomeSection({ title, icon, href, linkLabel, linkAriaLabel, children }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.icon}>{icon}</span>
          {title}
        </h2>
        <Link href={href} className={styles.more} aria-label={linkAriaLabel}>
          {linkLabel}
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
      {children}
    </section>
  );
}

// Las clases de dentro (tarjeta, lista, filas) para los resúmenes de cada sección
export { default as homeStyles } from "./HomeSection.module.css";
