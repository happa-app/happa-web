// Reglas del formulario de una tarea. La base de datos lo vuelve a comprobar todo (migración 12);
// aquí se valida antes para poder decir exactamente qué campo está mal.
import { z } from "zod";
import { addDays, isValidDate } from "./dates";
import {
  CHORE_ASSIGNMENTS,
  CHORE_FREQUENCIES,
  MAX_CHORE_INTERVAL,
  type ChoreAssignment,
  type ChoreEffort,
  type ChoreErrorKey,
  type ChoreFormField,
  type ChoreFrequency,
  type Weekday,
} from "./types";

export const uuidSchema = z.uuid();

export const MAX_TITLE = 60;
export const MAX_NOTES = 200;
// El primer día: de hoy a dentro de un año (lo mismo que la base de datos)
export const START_MAX_AHEAD = 366;

const choreFormShape = z.object({
  title: z.string(),
  notes: z.string(),
  effort: z.string(),
  frequency: z.string(),
  interval: z.string(),
  days: z.array(z.string()).max(7),
  startsOn: z.string(),
  assignment: z.string(),
  people: z.array(z.string()).max(50),
  requiresApproval: z.boolean(),
});

export type ChorePayload = {
  title: string;
  notes: string | null;
  effort: ChoreEffort;
  frequency: ChoreFrequency;
  interval: number;
  // Solo en semanal; si no, vacío
  weekdays: Weekday[];
  startsOn: string;
  assignment: ChoreAssignment;
  // En "fija", la persona; en "por turnos", el orden; en "libre", vacío
  people: string[];
  requiresApproval: boolean;
};

export type BuildChoreResult =
  | { ok: true; value: ChorePayload }
  | { ok: false; fieldErrors: Partial<Record<ChoreFormField, ChoreErrorKey>>; formError?: ChoreErrorKey };

// today: hoy en la zona horaria del hogar. keepStart: al editar, el primer día que ya tenía la tarea
// (si no se cambia, no se vuelve a comprobar: puede ser de hace tiempo).
export function buildChore(input: unknown, today: string, keepStart?: string): BuildChoreResult {
  const parsed = choreFormShape.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: {}, formError: "generic" };
  const v = parsed.data;
  const fieldErrors: Partial<Record<ChoreFormField, ChoreErrorKey>> = {};

  const title = v.title.trim();
  if (!title) fieldErrors.title = "titleRequired";
  else if (title.length > MAX_TITLE) fieldErrors.title = "titleTooLong";

  const notes = v.notes.trim();
  if (notes.length > MAX_NOTES) fieldErrors.notes = "notesTooLong";

  const effort = Number(v.effort);
  const frequency = CHORE_FREQUENCIES.find((f) => f === v.frequency);
  const assignment = CHORE_ASSIGNMENTS.find((a) => a === v.assignment);
  const interval = frequency === "once" ? 1 : Number(v.interval);
  if (
    !frequency ||
    !assignment ||
    ![1, 2, 3].includes(effort) ||
    !Number.isInteger(interval) ||
    interval < 1 ||
    interval > MAX_CHORE_INTERVAL
  ) {
    return { ok: false, fieldErrors, formError: "generic" };
  }

  let weekdays: Weekday[] = [];
  if (frequency === "weekly") {
    const unique = [...new Set(v.days)];
    weekdays = unique.filter((d) => /^[1-7]$/.test(d)).map((d) => Number(d) as Weekday);
    if (weekdays.length === 0 || weekdays.length !== unique.length) fieldErrors.days = "daysRequired";
    weekdays.sort((a, b) => a - b);
  }

  if (!isValidDate(v.startsOn)) fieldErrors.startsOn = "startInvalid";
  else if (v.startsOn !== keepStart && (v.startsOn < today || v.startsOn > addDays(today, START_MAX_AHEAD))) {
    fieldErrors.startsOn = "startInvalid";
  }

  let people: string[] = [];
  if (assignment !== "free") {
    people = v.people;
    if (people.some((p) => !uuidSchema.safeParse(p).success) || new Set(people).size !== people.length) {
      return { ok: false, fieldErrors, formError: "generic" };
    }
    if (assignment === "fixed" && people.length !== 1) fieldErrors.people = "personRequired";
    if (assignment === "rotation" && people.length === 0) fieldErrors.people = "rotationRequired";
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    value: {
      title,
      notes: notes || null,
      effort: effort as ChoreEffort,
      frequency,
      interval,
      weekdays,
      startsOn: v.startsOn,
      assignment,
      people,
      requiresApproval: v.requiresApproval,
    },
  };
}
