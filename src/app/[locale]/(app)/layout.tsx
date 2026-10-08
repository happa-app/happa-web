// Marco de la zona privada: cabecera (la campana de avisos, el nombre de la app y tu perfil), el
// contenido y la barra de abajo (Más · Inicio · Casas · Ruleta · Chat). Cerrar sesión está en Más.
// Todas las páginas dentro de (app) lo comparten; el proxy ya exige sesión para entrar.
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/features/navigation";
import { getNavHouseholds } from "@/features/navigation/server";
import { NotificationBell, PushKeeper } from "@/features/notifications";
import { ProfileButton } from "@/features/profile";
import { getMyProfile } from "@/features/profile/server";
import styles from "./app-layout.module.css";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // El hogar al que llevan "Inicio", "Ruleta" y "Chat" al abrir la app, en cuáles vives, y tu perfil
  // (Si fallara leer el perfil, la página se enseña igual, sin el círculo de arriba)
  const [{ householdId, householdIds }, profile] = await Promise.all([
    getNavHouseholds(),
    getMyProfile().catch((e: unknown) => {
      // Los "errores" internos de Next (por ejemplo, el aviso de que la página usa cookies y no puede
      // ser estática) no son fallos: se dejan pasar para que Next los trate
      unstable_rethrow(e);
      console.error("[perfil] no se pudo leer:", e);
      return null;
    }),
  ]);

  return (
    <div className={styles.shell}>
      {/* Arriba: la campana de avisos a la izquierda, el nombre en medio (sin enlace) y tu perfil */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <NotificationBell />
        </div>
        <span className={styles.brand}>Happa</span>
        <div className={styles.headerRight}>
          {profile ? <ProfileButton name={profile.name} avatarUrl={profile.avatarUrl} /> : null}
        </div>
      </header>
      <PushKeeper />
      <main className={styles.main}>{children}</main>
      <BottomNav initialHouseholdId={householdId} householdIds={householdIds} />
    </div>
  );
}
