// Una parte de la página del hogar (Inicio): raya arriba, etiqueta en mayúsculas pequeñas (con un dato
// detrás si hace falta), enlace "ver todo ›" a la derecha (lleva a su página) y debajo el resumen.
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./HomeSection.module.css";

type Props = {
  title: string;
  // Dato que va detrás de la etiqueta: "Compra · 5"
  meta?: string;
  href: string;
  // "ver todo" y, para lectores de pantalla, "Ver todo de Gastos"
  linkLabel: string;
  linkAriaLabel: string;
  children: ReactNode;
};

export function HomeSection({ title, meta, href, linkLabel, linkAriaLabel, children }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {title}
          {meta ? ` · ${meta}` : null}
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
