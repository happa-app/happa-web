// Horas, días y "quién está en casa". Sin acceso a la base de datos: vale en servidor y navegador.
import type { Absence, ScheduleBlock, Weekday } from "./types";

// "09:30" o "09:30:00" → 570 minutos desde medianoche. null si no es una hora válida.
export function toMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::00)?$/.exec(time.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// "09:00:00" (como lo devuelve la base de datos) → "09:00"
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

// 570 → "09:30"
export function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// Día de la semana de una fecha AAAA-MM-DD: 1 = lunes ... 7 = domingo
export function isoWeekday(isoDate: string): Weekday {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Ahora mismo en la zona horaria del hogar: el día, el día de la semana y los minutos desde medianoche
export function nowIn(timeZone: string, at: Date = new Date()): { date: string; weekday: Weekday; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, weekday: isoWeekday(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

// Las fechas de lunes a domingo de la semana en la que cae `today`
export function weekDates(today: string): Record<Weekday, string> {
  const monday = addDays(today, 1 - isoWeekday(today));
  return {
    1: monday,
    2: addDays(monday, 1),
    3: addDays(monday, 2),
    4: addDays(monday, 3),
    5: addDays(monday, 4),
    6: addDays(monday, 5),
    7: addDays(monday, 6),
  };
}

// Franjas de una persona un día de la semana, por orden
export function blocksOf(userId: string, blocks: ScheduleBlock[], weekday: Weekday): ScheduleBlock[] {
  return blocks
    .filter((b) => b.userId === userId && b.weekday === weekday)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// La ausencia de una persona que cubre ese día (si hay)
export function absenceOn(userId: string, absences: Absence[], isoDate: string): Absence | null {
  return absences.find((a) => a.userId === userId && a.startsOn <= isoDate && isoDate <= a.endsOn) ?? null;
}

// Dónde está una persona en un momento, según lo apuntado:
//   away → de ausencia ese día · out → en una franja de su horario · home → en ninguna (y la próxima de hoy)
export type Presence =
  | { state: "away"; absence: Absence }
  | { state: "out"; block: ScheduleBlock }
  | { state: "home"; next: ScheduleBlock | null };

export function presenceAt(
  userId: string,
  blocks: ScheduleBlock[],
  absences: Absence[],
  at: { date: string; weekday: Weekday; minutes: number },
): Presence {
  const absence = absenceOn(userId, absences, at.date);
  if (absence) return { state: "away", absence };
  const today = blocksOf(userId, blocks, at.weekday);
  const current = today.find((b) => (toMinutes(b.startsAt) ?? 0) <= at.minutes && at.minutes < (toMinutes(b.endsAt) ?? 0));
  if (current) return { state: "out", block: current };
  return { state: "home", next: today.find((b) => (toMinutes(b.startsAt) ?? 0) > at.minutes) ?? null };
}
