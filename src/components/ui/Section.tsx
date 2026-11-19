// Una parte de una página: raya arriba, etiqueta en mayúsculas pequeñas (con un dato detrás si hace
// falta), enlace opcional "ver todo ›" a la derecha (lleva a su página) y debajo el contenido.
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./Section.module.css";

type Props = {
  title: string;
  // Dato que va detrás de la etiqueta: "Compra · 5"
  meta?: string;
  // Enlace de la derecha (opcional): "ver todo" y, para lectores de pantalla, "Ver todo de Gastos"
  link?: { href: string; label: string; ariaLabel: string };
  children: ReactNode;
};

export function Section({ title, meta, link, children }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {title}
          {meta ? ` · ${meta}` : null}
        </h2>
        {link ? (
          <Link href={link.href} className={styles.more} aria-label={link.ariaLabel}>
            {link.label}
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

// Las clases de dentro (tarjeta, lista, filas) para los resúmenes de cada sección
export { default as sectionStyles } from "./Section.module.css";
