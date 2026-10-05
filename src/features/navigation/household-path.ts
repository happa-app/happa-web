// Barra de abajo: qué pestaña está activa y adónde lleva cada una.
// Funciones sin React, para usarlas en el servidor, en el navegador y en las pruebas.

// Cookie con el último hogar abierto: así "Inicio", "Ruleta" y "Chat" saben a qué hogar ir
// cuando estás en una pantalla que no es de un hogar (Casas, Avisos...). Solo guarda el id.
export const NAV_HOUSEHOLD_COOKIE = "happa_hogar";

export const NAV_TABS = ["more", "home", "households", "roulette", "chat"] as const;
export type NavTab = (typeof NAV_TABS)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// /hogar/<id> o /hogar/<id>/<sección>/... (el id tiene que acabar ahí: /hogar/<id>x no vale)
const HOUSEHOLD_PATH = /^\/hogar\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/([^/?#]+))?(?=[/?#]|$)/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID.test(value);
}

// El hogar de la ruta (/hogar/<id>/...), o null si la pantalla no es de un hogar
export function householdIdFromPath(pathname: string): string | null {
  return HOUSEHOLD_PATH.exec(pathname)?.[1]?.toLowerCase() ?? null;
}

// La pestaña que se marca en cada pantalla
export function activeTab(pathname: string): NavTab | null {
  const match = HOUSEHOLD_PATH.exec(pathname);
  if (match) {
    const section = match[2];
    if (!section) return "home";
    if (section === "chat") return "chat";
    if (section === "ruleta") return "roulette";
    if (section === "mas" || section === "configuracion") return "more";
    // Compra, gastos, horarios y tareas se abren desde Inicio
    return "home";
  }
  if (pathname === "/inicio" || pathname === "/hogar/nuevo" || pathname === "/unirse" || pathname.startsWith("/unirse/")) {
    return "households";
  }
  // Los avisos van con la campana de arriba: no se marca ninguna pestaña
  if (pathname === "/mas" || pathname === "/compra") return "more";
  return null;
}

// Adónde lleva cada pestaña. Sin hogar, las del hogar llevan a Casas (para elegir o crear uno).
export function tabHref(tab: NavTab, householdId: string | null): string {
  if (tab === "households") return "/inicio";
  if (tab === "more") return householdId ? `/hogar/${householdId}/mas` : "/mas";
  if (!householdId) return "/inicio";
  if (tab === "home") return `/hogar/${householdId}`;
  if (tab === "roulette") return `/hogar/${householdId}/ruleta`;
  return `/hogar/${householdId}/chat`;
}

// Qué hogar usa la barra: el guardado en la cookie si sigues en él; si no, el primero al que te uniste
export function pickNavHousehold(saved: string | null | undefined, myHouseholds: string[]): string | null {
  if (isUuid(saved) && myHouseholds.includes(saved.toLowerCase())) return saved.toLowerCase();
  return myHouseholds[0] ?? null;
}
