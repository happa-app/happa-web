// Cómo se ordenan y agrupan los mensajes en pantalla. Sin acceso a la base de datos: vale en servidor
// y navegador (y se puede probar sola).
import { EDIT_MINUTES, type ChatMessage } from "./types";

// Varios mensajes seguidos de la misma persona en menos de 5 minutos van juntos (el nombre sale una vez)
const GROUP_MINUTES = 5;

// Las fechas llegan de la base de datos con microsegundos y en formatos un poco distintos
// ("2026-10-05T10:00:00.12+00:00" por la API, "2026-10-05T10:00:00.12+00" en vivo). Se dejan todas
// igual ("2026-10-05T10:00:00.120000Z") para poder ordenarlas como texto sin perder los microsegundos.
export function normalizeTimestamp(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]00(?::?00)?)?$/.exec(value.trim());
  if (match) return `${match[1]}T${match[2]}.${(match[3] ?? "").padEnd(6, "0").slice(0, 6)}Z`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toISOString().slice(0, 23)}000Z`;
}

// Una fecha ya normalizada, como Date (con milisegundos)
export function toDate(timestamp: string): Date {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(timestamp)
    ? new Date(`${timestamp.slice(0, 23)}Z`)
    : new Date(timestamp);
}

// Día AAAA-MM-DD de un momento en una zona horaria
export function dayIn(timestamp: string, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(toDate(timestamp))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// "14:05" en la zona horaria del hogar
export function formatTime(timestamp: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(toDate(timestamp));
}

// Orden de los mensajes: por fecha y, si coinciden, por id. Los que se están mandando, al final.
export function compareMessages(a: ChatMessage, b: ChatMessage): number {
  if (Boolean(a.pending || a.failed) !== Boolean(b.pending || b.failed)) return a.pending || a.failed ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Mete o sustituye un mensaje (por id) y deja la lista ordenada
export function upsertMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const rest = list.filter((m) => m.id !== message.id);
  return [...rest, message].sort(compareMessages);
}

// ¿Se puede editar todavía? (tuyo y de hace menos de 15 minutos)
export function canEdit(message: ChatMessage, me: string, now: Date = new Date()): boolean {
  return (
    message.senderId === me &&
    !message.pending &&
    !message.failed &&
    now.getTime() - toDate(message.createdAt).getTime() < EDIT_MINUTES * 60_000
  );
}

export type DayLabel = { kind: "today" } | { kind: "yesterday" } | { kind: "date"; date: string };

export type TimelineItem =
  | { kind: "day"; key: string; label: DayLabel }
  | { kind: "message"; key: string; message: ChatMessage; mine: boolean; showName: boolean; lastInGroup: boolean };

// La lista que se pinta: separadores de día y mensajes, marcando dónde empieza y acaba cada grupo.
// today: hoy en la zona horaria del hogar.
export function buildTimeline(messages: ChatMessage[], me: string, timeZone: string, today: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  let lastDay: string | null = null;
  messages.forEach((message, i) => {
    const day = dayIn(message.createdAt, timeZone);
    if (day !== lastDay) {
      const label: DayLabel =
        day === today ? { kind: "today" } : day === addDays(today, -1) ? { kind: "yesterday" } : { kind: "date", date: day };
      items.push({ kind: "day", key: `day-${day}`, label });
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const together = (a?: ChatMessage, b?: ChatMessage) => {
      if (!a || !b) return false;
      return (
        a.senderId === b.senderId &&
        dayIn(a.createdAt, timeZone) === dayIn(b.createdAt, timeZone) &&
        Math.abs(toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()) < GROUP_MINUTES * 60_000
      );
    };
    items.push({
      kind: "message",
      key: message.id,
      message,
      mine: message.senderId === me,
      showName: !together(prev, message),
      lastInGroup: !together(message, next),
    });
    lastDay = day;
  });
  return items;
}
