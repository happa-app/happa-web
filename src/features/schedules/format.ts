// Cómo se enseñan horas y días en los horarios (vale en servidor y navegador).

// "09:00" → "9:00"; "14:30" → "14:30"
export function formatTime(hhmm: string): string {
  return hhmm.replace(/^0(\d)/, "$1");
}

// "2026-10-12" → "12 oct" (es) / "Oct 12" (en). Los días se leen en UTC para que no cambien de fecha.
export function formatDay(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

// Posición en la barra del día (de 6:00 a 24:00), en %
export const BAR_START = 6 * 60;
export const BAR_END = 24 * 60;
export function barPosition(fromMinutes: number, toMinutes: number): { left: number; width: number } | null {
  const from = Math.max(fromMinutes, BAR_START);
  const to = Math.min(toMinutes, BAR_END);
  if (to <= from) return null;
  const span = BAR_END - BAR_START;
  return { left: ((from - BAR_START) / span) * 100, width: ((to - from) / span) * 100 };
}
