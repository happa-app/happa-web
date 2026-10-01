// Quién puede tocar cada producto. Es lo mismo que comprueba la base de datos (RLS, migración 6);
// aquí solo sirve para enseñar o esconder los botones.
import type { ShoppingItem } from "./types";

// canManageAll: adultos del hogar, o tu propia lista personal. Los menores solo lo que pidieron.
export function canEditItem(item: ShoppingItem, currentUserId: string, canManageAll: boolean): boolean {
  return canManageAll || item.requestedBy === currentUserId;
}

// La cantidad solo se enseña si es más de 1 (lo normal es comprar uno): "×2", "×12"...
export function shownQuantity(item: ShoppingItem): string | null {
  return item.quantity > 1 ? `×${item.quantity}` : null;
}
