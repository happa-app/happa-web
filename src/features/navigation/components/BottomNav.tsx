"use client";
// Barra de abajo: Más · Inicio · Casas · Ruleta · Chat.
// "Inicio", "Ruleta" y "Chat" son del hogar en el que estás. Si estás en una pantalla que no es de
// un hogar (Casas, Avisos...), usan el último que abriste (o el que manda el servidor al cargar).
// Solo valen hogares en los que vives ahora: si abres uno del que te fuiste (por ejemplo, para ver
// lo que debes), la barra sigue en el tuyo.
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { ChatIcon, HomeIcon, HousesIcon, MoreIcon, WheelIcon } from "@/components/brand/Icons";
import { Link, usePathname } from "@/i18n/navigation";
import { activeTab, householdIdFromPath, NAV_HOUSEHOLD_COOKIE, NAV_TABS, tabHref, type NavTab } from "../household-path";
import styles from "./BottomNav.module.css";

const ICONS: Record<NavTab, ReactNode> = {
  more: <MoreIcon />,
  home: <HomeIcon />,
  households: <HousesIcon />,
  roulette: <WheelIcon />,
  chat: <ChatIcon />,
};

const ONE_YEAR = 60 * 60 * 24 * 365;

type Props = {
  // El hogar que manda el servidor (el de la cookie, o el primero) y todos en los que vives
  initialHouseholdId: string | null;
  householdIds: string[];
};

export function BottomNav({ initialHouseholdId, householdIds }: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const inPath = householdIdFromPath(pathname);
  const fromPath = inPath && householdIds.includes(inPath) ? inPath : null;

  // El último hogar abierto. Se ajusta mientras se pinta (sin efectos) cuando cambia la ruta o lo
  // que manda el servidor (por ejemplo, al salir de un hogar).
  const [last, setLast] = useState(initialHouseholdId);
  const [prevInitial, setPrevInitial] = useState(initialHouseholdId);
  if (initialHouseholdId !== prevInitial) {
    setPrevInitial(initialHouseholdId);
    setLast(initialHouseholdId);
  }
  if (fromPath && fromPath !== last) setLast(fromPath);

  // Se guarda en una cookie para la próxima vez que abras la app
  useEffect(() => {
    if (!fromPath) return;
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${NAV_HOUSEHOLD_COOKIE}=${fromPath}; path=/; max-age=${ONE_YEAR}; samesite=lax${secure}`;
  }, [fromPath]);

  const remembered = last && householdIds.includes(last) ? last : null;
  const householdId = fromPath ?? remembered ?? initialHouseholdId;
  // En un hogar que no es tuyo no se marca ninguna pestaña (no llevan ahí)
  const active = inPath && !fromPath ? null : activeTab(pathname);

  return (
    <nav className={styles.bar} aria-label={t("label")}>
      <ul className={styles.list}>
        {NAV_TABS.map((tab) => (
          <li key={tab} className={styles.item}>
            <Link
              href={tabHref(tab, householdId)}
              className={tab === active ? styles.tabActive : styles.tab}
              aria-current={tab === active ? "page" : undefined}
            >
              <span className={styles.icon}>{ICONS[tab]}</span>
              <span className={styles.label}>{t(tab)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
