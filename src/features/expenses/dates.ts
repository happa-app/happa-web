// Fechas como texto AAAA-MM-DD (días sin hora). Sin dependencias: vale en servidor y navegador.

// Primer cargo de un gasto fijo: como mucho 3 meses atrás y un año adelante (lo mismo que la base de datos)
export const RECURRING_START_MIN_DAYS = -92;
export const RECURRING_START_MAX_DAYS = 366;

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
