// Tipos de las tareas del hogar. Los días van como texto AAAA-MM-DD (en la zona horaria del hogar).

// Cada cuánto se repite: una vez, cada N días, ciertos días de la semana cada N semanas, cada N meses
export const CHORE_FREQUENCIES = ["once", "daily", "weekly", "monthly"] as const;
export type ChoreFrequency = (typeof CHORE_FREQUENCIES)[number];

// A quién le toca: siempre a la misma persona, por turnos, o libre (quien la coja)
export const CHORE_ASSIGNMENTS = ["fixed", "rotation", "free"] as const;
export type ChoreAssignment = (typeof CHORE_ASSIGNMENTS)[number];

// Pendiente, esperando el visto bueno de un adulto (la marcó un menor) o hecha
export type ChoreStatus = "pending" | "review" | "done";

// Esfuerzo: 1 ligera, 2 normal, 3 pesada
export const CHORE_EFFORTS = [1, 2, 3] as const;
export type ChoreEffort = (typeof CHORE_EFFORTS)[number];

// 1 = lunes ... 7 = domingo (como la base de datos)
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

// Como mucho cada 12 días, semanas o meses (lo mismo que la base de datos)
export const MAX_CHORE_INTERVAL = 12;

export type ChorePerson = {
  userId: string;
  name: string;
  role: "admin" | "member" | "minor";
};

export type Chore = {
  id: string;
  title: string;
  notes: string | null;
  effort: ChoreEffort;
  frequency: ChoreFrequency;
  interval: number;
  // Solo en semanal (si no, vacío)
  weekdays: Weekday[];
  startsOn: string;
  assignment: ChoreAssignment;
  // Solo en "fija"
  assigneeId: string | null;
  // Solo en "por turnos": en orden. owed = se saltó su turno por una ausencia y le toca al volver.
  rotation: { userId: string; owed: boolean }[];
  requiresApproval: boolean;
};

// Un día en el que toca hacer una tarea
export type ChoreDay = {
  id: string;
  choreId: string;
  dueOn: string;
  // null = libre
  assigneeId: string | null;
  status: ChoreStatus;
  doneBy: string | null;
  doneAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
  // Cambiada a mano (otra persona o "me la quedo")
  manual: boolean;
};

export type ChoresOverview = {
  householdName: string;
  timezone: string;
  // Hoy en la zona horaria del hogar
  today: string;
  // Quienes viven en el hogar (adultos y menores)
  people: ChorePerson[];
  // ¿Eres adulto en este hogar? (crea, cambia y reparte tareas; da el visto bueno)
  isAdult: boolean;
  chores: Chore[];
  // Días de las tareas: lo pendiente que se ha pasado, la última semana y las dos que vienen
  days: ChoreDay[];
};

// Para la tarjeta de la página del hogar
export type ChoresSummary = { choreCount: number; myToday: number; myOverdue: number; toApprove: number };

// Errores que pueden ver los usuarios (claves de messages/*.json → Chores.errors)
export const CHORE_ERROR_KEYS = [
  "titleRequired",
  "titleTooLong",
  "notesTooLong",
  "daysRequired",
  "startInvalid",
  "personRequired",
  "rotationRequired",
  "personGone",
  "alreadyDone",
  "notDone",
  "notWaiting",
  "onlyOwn",
  "taken",
  "notFound",
  "notAllowed",
  "generic",
] as const;
export type ChoreErrorKey = (typeof CHORE_ERROR_KEYS)[number];

export type ChoreFormField = "title" | "notes" | "days" | "startsOn" | "people";
export type ChoreFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<ChoreFormField, ChoreErrorKey>>;
  formError?: ChoreErrorKey;
};

export type ChoreActionState = { status: "idle" | "done" | "error"; error?: ChoreErrorKey };
export const initialChoreActionState: ChoreActionState = { status: "idle" };
