// Reglas de los formularios de horario y ausencias. La base de datos lo vuelve a comprobar todo
// (migración 11); aquí se valida antes para poder decir exactamente qué campo está mal.
import { z } from "zod";
import { addDays, isValidDate, toMinutes } from "./time";
import { SCHEDULE_KINDS, type ScheduleErrorKey, type ScheduleKind, type Weekday } from "./types";

export const uuidSchema = z.uuid();

export const MAX_LABEL = 40;
export const MAX_NOTE = 80;
// Una ausencia: como mucho un año, y empezando como mucho dentro de un año (lo mismo que la base de datos)
export const ABSENCE_MAX_DAYS = 365;
export const ABSENCE_MAX_AHEAD = 366;

const blockFormShape = z.object({
  days: z.array(z.string()).max(7),
  startsAt: z.string(),
  endsAt: z.string(),
  kind: z.string(),
  label: z.string(),
});

export type BlockPayload = {
  weekdays: Weekday[];
  startsAt: string;
  endsAt: string;
  kind: ScheduleKind;
  label: string | null;
};

type BlockField = "days" | "startsAt" | "endsAt" | "label";
export type BuildBlockResult =
  | { ok: true; value: BlockPayload }
  | { ok: false; fieldErrors: Partial<Record<BlockField, ScheduleErrorKey>>; formError?: ScheduleErrorKey };

export function buildBlock(input: unknown): BuildBlockResult {
  const parsed = blockFormShape.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: {}, formError: "generic" };
  const v = parsed.data;
  const fieldErrors: Partial<Record<BlockField, ScheduleErrorKey>> = {};

  const weekdays = [...new Set(v.days)].filter((d) => /^[1-7]$/.test(d)).map((d) => Number(d) as Weekday);
  if (weekdays.length === 0 || weekdays.length !== new Set(v.days).size) fieldErrors.days = "daysRequired";
  weekdays.sort((a, b) => a - b);

  const start = toMinutes(v.startsAt);
  const end = toMinutes(v.endsAt);
  if (start === null) fieldErrors.startsAt = "timeInvalid";
  if (end === null) fieldErrors.endsAt = "timeInvalid";
  else if (start !== null && end <= start) fieldErrors.endsAt = "endBeforeStart";

  const kind = SCHEDULE_KINDS.find((k) => k === v.kind);
  if (!kind) return { ok: false, fieldErrors, formError: "generic" };

  const label = v.label.trim();
  if (label.length > MAX_LABEL) fieldErrors.label = "labelTooLong";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    value: { weekdays, startsAt: v.startsAt.trim().slice(0, 5), endsAt: v.endsAt.trim().slice(0, 5), kind, label: label || null },
  };
}

const absenceFormShape = z.object({ startsOn: z.string(), endsOn: z.string(), note: z.string() });

export type AbsencePayload = { startsOn: string; endsOn: string; note: string | null };
type AbsenceField = "startsOn" | "endsOn" | "note";
export type BuildAbsenceResult =
  | { ok: true; value: AbsencePayload }
  | { ok: false; fieldErrors: Partial<Record<AbsenceField, ScheduleErrorKey>>; formError?: ScheduleErrorKey };

// today: hoy en la zona horaria del hogar
export function buildAbsence(input: unknown, today: string): BuildAbsenceResult {
  const parsed = absenceFormShape.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: {}, formError: "generic" };
  const v = parsed.data;
  const fieldErrors: Partial<Record<AbsenceField, ScheduleErrorKey>> = {};

  if (!isValidDate(v.startsOn)) fieldErrors.startsOn = "dateInvalid";
  if (!isValidDate(v.endsOn)) fieldErrors.endsOn = "dateInvalid";
  if (!fieldErrors.startsOn && !fieldErrors.endsOn) {
    if (v.endsOn < v.startsOn) fieldErrors.endsOn = "absenceEndBeforeStart";
    else if (v.endsOn < today) fieldErrors.endsOn = "absencePast";
    else if (v.startsOn > addDays(today, ABSENCE_MAX_AHEAD) || v.endsOn > addDays(v.startsOn, ABSENCE_MAX_DAYS)) {
      fieldErrors.endsOn = "absenceTooLong";
    }
  }

  const note = v.note.trim();
  if (note.length > MAX_NOTE) fieldErrors.note = "noteTooLong";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, value: { startsOn: v.startsOn, endsOn: v.endsOn, note: note || null } };
}
