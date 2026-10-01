// Marco común de las pantallas de acceso: logo arriba y la tarjeta del formulario.
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import styles from "./auth-layout.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logoLink}>
        <Logo />
      </Link>
      <div className={styles.card}>{children}</div>
    </main>
  );
}
