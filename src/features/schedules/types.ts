// Tipos de horarios y ausencias.
// Las horas van como texto "HH:MM" (la hora del reloj del hogar) y los días como texto AAAA-MM-DD.

export const SCHEDULE_KINDS = ["class", "work", "away"] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

// 1 = lunes ... 7 = domingo (como la base de datos)
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

// Una franja del horario semanal: "los lunes de 9:00 a 14:00, clase"
export type ScheduleBlock = {
  id: string;
  userId: string;
  weekday: Weekday;
  startsAt: string;
  endsAt: string;
  kind: ScheduleKind;
  label: string | null;
};

// "Estoy fuera del día X al día Y" (los dos incluidos)
export type Absence = {
  id: string;
  userId: string;
  startsOn: string;
  endsOn: string;
  note: string | null;
};

// Una persona que vive en el hogar. canEdit: puedes cambiar su horario (eres tú o su tutor).
export type SchedulePerson = {
  userId: string;
  name: string;
  // Su foto (null si no tiene)
  avatarUrl: string | null;
  role: "admin" | "member" | "minor";
  canEdit: boolean;
};

export type ScheduleOverview = {
  householdName: string;
  timezone: string;
  people: SchedulePerson[];
  blocks: ScheduleBlock[];
  // Solo las que siguen en pie (acaban hoy o después)
  absences: Absence[];
};

// Otro hogar tuyo en el que tienes horario (para copiarlo aquí)
export type OtherSchedule = { householdId: string; name: string; blockCount: number };

// Errores que pueden ver los usuarios (claves de messages/*.json → Schedules.errors)
export const SCHEDULE_ERROR_KEYS = [
  "daysRequired",
  "timeInvalid",
  "endBeforeStart",
  "overlap",
  "labelTooLong",
  "tooMany",
  "dateInvalid",
  "absenceEndBeforeStart",
  "absencePast",
  "absenceTooLong",
  "absenceOverlap",
  "noteTooLong",
  "nothingToCopy",
  "notAllowed",
  "generic",
] as const;
export type ScheduleErrorKey = (typeof SCHEDULE_ERROR_KEYS)[number];

export type BlockFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<"days" | "startsAt" | "endsAt" | "label", ScheduleErrorKey>>;
  formError?: ScheduleErrorKey;
};

export type AbsenceFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<"startsOn" | "endsOn" | "note", ScheduleErrorKey>>;
  formError?: ScheduleErrorKey;
};

export type ScheduleActionState = { status: "idle" | "error"; error?: ScheduleErrorKey };
export const initialScheduleActionState: ScheduleActionState = { status: "idle" };
