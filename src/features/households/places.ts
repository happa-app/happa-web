// Plazas del hogar: cuántas personas pueden vivir en él (migración 15).
// Las reglas de verdad están en la base de datos; esto es lo mismo para enseñarlo en pantalla.
import type { HouseholdKind, HouseholdRole } from "./types";

export const MIN_PLACES = 1;
export const MAX_PLACES = 20;

// Lo normal para cada tipo de hogar (igual que household_default_places en la base de datos)
export function defaultPlaces(kind: HouseholdKind | string | undefined): number {
  if (kind === "couple") return 2;
  if (kind === "family") return 6;
  return 4;
}

// Quienes ocupan plaza: todos los que viven en el hogar (el casero no)
export function residentCount(members: { role: HouseholdRole }[]): number {
  return members.filter((m) => m.role !== "landlord").length;
}

export function isFull(residents: number, places: number): boolean {
  return residents >= places;
}

// Lo que se escribe en el campo, como número válido (o null si no lo es)
export function parsePlaces(value: string): number | null {
  if (!/^\d{1,2}$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= MIN_PLACES && n <= MAX_PLACES ? n : null;
}

// Para los botones − y +: siempre dentro de los límites
export function stepPlaces(value: string, delta: number, min: number, max: number): number {
  const n = parsePlaces(value) ?? min;
  return Math.min(max, Math.max(min, n + delta));
}
