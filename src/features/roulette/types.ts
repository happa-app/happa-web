// Tipos de la ruleta del marrón (migraciones 16 y 17)

export const MIN_PEOPLE = 2;
export const MAX_PEOPLE = 20;
// Giros que se enseñan en el historial
export const HISTORY_SIZE = 10;

export type RoulettePerson = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: "admin" | "member" | "minor";
  // Si hoy está de ausencia: hasta qué día (AAAA-MM-DD). Por defecto no entra.
  awayUntil: string | null;
};

export type RouletteSpin = {
  id: string;
  spunBy: string | null;
  chosenId: string | null;
  createdAt: string;
  // Quiénes entraban
  participants: string[];
};

export type RoulettePage = {
  householdName: string;
  timezone: string;
  isAdult: boolean;
  people: RoulettePerson[];
  spins: RouletteSpin[];
};

// Errores que pueden ver los usuarios (claves de messages/*.json → Roulette.errors)
export const ROULETTE_ERROR_KEYS = [
  "needTwo",
  "tooManyPeople",
  "notResident",
  "onlyAdults",
  "tooManySpins",
  "generic",
] as const;
export type RouletteErrorKey = (typeof ROULETTE_ERROR_KEYS)[number];
