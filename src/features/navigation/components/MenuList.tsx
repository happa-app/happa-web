// Lista de accesos de la pantalla "Más": un grupo con título y sus enlaces (icono, nombre y una
// línea que explica qué hay dentro).
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./MenuList.module.css";

export type MenuItem = {
  href: string;
  icon: ReactNode;
  title: string;
  description?: string;
};

export function MenuList({ title, items }: { title: string; items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.group}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.row}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.text}>
                <span className={styles.name}>{item.title}</span>
                {item.description ? <span className={styles.description}>{item.description}</span> : null}
              </span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
