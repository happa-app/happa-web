// Tipos de la lista de la compra.

// Qué lista se está viendo: la común de un hogar o la personal de alguien.
export type ShoppingScope =
  | { type: "household"; householdId: string }
  | { type: "personal"; userId: string };

export type ShoppingItem = {
  id: string;
  name: string;
  // Unidades, del 1 al 99 (1 si no se indica)
  quantity: number;
  checkedAt: string | null;
  createdAt: string;
  requestedBy: string | null;
  requestedByName: string | null;
  // Mientras se guarda (cambio optimista), el producto se muestra atenuado
  pending?: boolean;
};

// Hogar al que se puede pedir un producto desde la lista personal
export type ShareTarget = { id: string; name: string };

export const SHOPPING_ERROR_KEYS = ["nameRequired", "nameTooLong", "quantityInvalid", "generic"] as const;
export type ShoppingErrorKey = (typeof SHOPPING_ERROR_KEYS)[number];
