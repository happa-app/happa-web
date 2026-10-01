// Lo que el resto de la app puede usar de esta feature. Importa desde "@/features/shopping".
// Las lecturas para la primera carga están en "@/features/shopping/server".
export { ShoppingList } from "./components/ShoppingList";
export { ShoppingPreview } from "./components/ShoppingPreview";
export type { ShareTarget, ShoppingItem, ShoppingScope } from "./types";
