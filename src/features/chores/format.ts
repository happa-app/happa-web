// Cómo se enseñan días y horas en las tareas (vale en servidor y navegador).
// Los días AAAA-MM-DD se leen en UTC para que no cambien de fecha.
import { daysBetween } from "./dates";
import type { Weekday } from "./types";

function utc(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

// "2026-10-05" → "lun 5 oct" (es) / "Mon, Oct 5" (en)
export function formatDay(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    utc(isoDate),
  );
}

// "2026-10-05" → "5 oct" (es) / "Oct 5" (en)
export function formatShortDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(utc(isoDate));
}

// Momento (con hora) en la zona horaria del hogar: "5 oct, 20:14"
export function formatMoment(timestamp: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(timestamp));
}

// Nombre del día de la semana en minúscula si el idioma lo usa así ("lunes" / "Monday")
export function weekdayName(weekday: Weekday, locale: string): string {
  // 1 ene 2024 fue lunes
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(utc(`2024-01-0${weekday}`));
}

// "lunes y jueves" / "Monday and Thursday"
export function weekdayList(weekdays: readonly Weekday[], locale: string): string {
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(weekdays.map((d) => weekdayName(d, locale)));
}

// Cuántos días faltan (o han pasado, en negativo) desde hoy
export function dayOffset(isoDate: string, today: string): number {
  return daysBetween(today, isoDate);
}
