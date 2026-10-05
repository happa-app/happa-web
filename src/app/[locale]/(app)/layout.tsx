// Marco de la zona privada: cabecera con el logo, la campana de avisos y "Cerrar sesión", el contenido
// y la barra de abajo (Más · Inicio · Casas · Ruleta · Chat).
// Todas las páginas dentro de (app) lo comparten; el proxy ya exige sesión para entrar.
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/features/auth";
import { BottomNav } from "@/features/navigation";
import { getNavHouseholds } from "@/features/navigation/server";
import { NotificationBell, PushKeeper } from "@/features/notifications";
import { Link } from "@/i18n/navigation";
import styles from "./app-layout.module.css";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // El hogar al que llevan "Inicio", "Ruleta" y "Chat" al abrir la app, y en cuáles vives
  const { householdId, householdIds } = await getNavHouseholds();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/inicio" className={styles.logoLink}>
          <Logo />
        </Link>
        <div className={styles.headerRight}>
          <NotificationBell />
          <SignOutButton />
        </div>
      </header>
      <PushKeeper />
      <main className={styles.main}>{children}</main>
      <BottomNav initialHouseholdId={householdId} householdIds={householdIds} />
    </div>
  );
}
