// Tipos de la lista de la compra.

// Qué lista se está viendo: la común de un hogar o la personal de alguien.
export type ShoppingScope =
  | { type: "household"; householdId: string }
  | { type: "personal"; userId: string };

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  checkedAt: string | null;
  createdAt: string;
  requestedBy: string | null;
  requestedByName: string | null;
  // Mientras se guarda (cambio optimista), el producto se muestra atenuado
  pending?: boolean;
};

// Hogar al que se puede pedir un producto desde la lista personal
export type ShareTarget = { id: string; name: string };

export const SHOPPING_ERROR_KEYS = ["nameRequired", "nameTooLong", "quantityTooLong", "generic"] as const;
export type ShoppingErrorKey = (typeof SHOPPING_ERROR_KEYS)[number];
