// Navegación de la zona privada: la barra de abajo y la lista de accesos de "Más".
// El hogar de la barra se lee en el servidor desde "@/features/navigation/server".
export { BottomNav } from "./components/BottomNav";
export { MenuList, type MenuItem } from "./components/MenuList";
export { MoreMenu } from "./components/MoreMenu";
export { activeTab, householdIdFromPath, NAV_HOUSEHOLD_COOKIE, tabHref, type NavTab } from "./household-path";
