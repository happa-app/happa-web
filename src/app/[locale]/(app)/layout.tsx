// Marco de la zona privada: cabecera con el logo y "Cerrar sesión", y el contenido debajo.
// Todas las páginas dentro de (app) lo comparten; el proxy ya exige sesión para entrar.
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/features/auth";
import { Link } from "@/i18n/navigation";
import styles from "./app-layout.module.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/inicio" className={styles.logoLink}>
          <Logo />
        </Link>
        <SignOutButton />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
