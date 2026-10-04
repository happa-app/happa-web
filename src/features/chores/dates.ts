// Fechas como texto AAAA-MM-DD (días sin hora) y cada cuánto toca una tarea.
// Sin acceso a la base de datos: vale en servidor y navegador.
import type { ChoreFrequency, Weekday } from "./types";

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

// Días que hay de una fecha a otra (negativo si la segunda es antes)
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// 1 = lunes ... 7 = domingo
export function isoWeekday(isoDate: string): Weekday {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

// El lunes de la semana de esa fecha
export function mondayOf(isoDate: string): string {
  return addDays(isoDate, 1 - isoWeekday(isoDate));
}

// Hoy en una zona horaria ("Europe/Madrid")
export function todayIn(timeZone: string, at: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Suma meses; si ese día no existe en el mes de destino, el último del mes (31 ene + 1 mes = 28 feb),
// igual que la base de datos.
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

function monthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export type ChoreRepeat = {
  frequency: ChoreFrequency;
  interval: number;
  weekdays: readonly Weekday[];
  startsOn: string;
};

// ¿Toca ese día? Lo mismo que chore_occurs_on en la base de datos (migración 12).
export function occursOn(repeat: ChoreRepeat, day: string): boolean {
  const { frequency, startsOn } = repeat;
  const interval = Math.max(1, repeat.interval);
  if (day < startsOn) return false;
  switch (frequency) {
    case "once":
      return day === startsOn;
    case "daily":
      return daysBetween(startsOn, day) % interval === 0;
    case "weekly":
      return (
        repeat.weekdays.includes(isoWeekday(day)) && (daysBetween(mondayOf(startsOn), mondayOf(day)) / 7) % interval === 0
      );
    case "monthly": {
      const months = monthsBetween(startsOn, day);
      return months % interval === 0 && addMonths(startsOn, months) === day;
    }
  }
}

// Los próximos días en que toca, desde `from` (incluido). Mira como mucho 400 días por delante.
export function nextDates(repeat: ChoreRepeat, from: string, count: number): string[] {
  const dates: string[] = [];
  let day = from < repeat.startsOn ? repeat.startsOn : from;
  for (let i = 0; i < 400 && dates.length < count; i += 1) {
    if (occursOn(repeat, day)) dates.push(day);
    if (repeat.frequency === "once" && day >= repeat.startsOn) break;
    day = addDays(day, 1);
  }
  return dates;
}
