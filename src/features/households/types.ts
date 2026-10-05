// Tipos de la feature de hogares. Los tipos de la base de datos salen del archivo
// generado por Supabase, así que si cambia una tabla, TypeScript avisa aquí.
import type { Database } from "@/types/database.types";

export type HouseholdKind = Database["public"]["Enums"]["household_kind"];
export type HouseholdRole = Database["public"]["Enums"]["household_role"];

export const HOUSEHOLD_KINDS = ["shared_flat", "student_flat", "couple", "family"] as const satisfies readonly HouseholdKind[];

export type HouseholdSummary = {
  id: string;
  name: string;
  kind: HouseholdKind;
  role: HouseholdRole;
  // Personas que viven en el hogar (sin el casero) y cuántas caben
  memberCount: number;
  maxMembers: number;
};

export type HouseholdMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: HouseholdRole;
};

export type HouseholdDetail = {
  id: string;
  name: string;
  kind: HouseholdKind;
  inviteCode: string;
  // Cuántas personas caben (migración 15)
  maxMembers: number;
  members: HouseholdMember[];
};

export type InvitePreview = {
  householdId: string;
  name: string;
  kind: HouseholdKind;
  memberCount: number;
  maxMembers: number;
  alreadyMember: boolean;
};

// Errores que pueden ver los usuarios (claves de messages/*.json → Households.errors)
export const HOUSEHOLD_ERROR_KEYS = [
  "nameRequired",
  "nameTooLong",
  "kindRequired",
  "codeInvalid",
  "minorCannotCreate",
  "minorCannotJoin",
  "professionalCannotJoin",
  "householdFull",
  "placesInvalid",
  "placesTooFew",
  "notAdmin",
  "generic",
] as const;

export type HouseholdErrorKey = (typeof HOUSEHOLD_ERROR_KEYS)[number];

export type HouseholdFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<string, string[]>>;
  formError?: HouseholdErrorKey;
  values?: { name?: string; kind?: string; code?: string; places?: string };
};

export const initialHouseholdState: HouseholdFormState = { status: "idle" };

// Cambiar las plazas desde Configuración
export type PlacesFormState = {
  status: "idle" | "done" | "error";
  error?: HouseholdErrorKey;
};

export const initialPlacesState: PlacesFormState = { status: "idle" };

export function firstFieldError(
  state: HouseholdFormState,
  field: string,
): HouseholdErrorKey | undefined {
  const message = state.fieldErrors?.[field]?.[0];
  if (!message) return undefined;
  return (HOUSEHOLD_ERROR_KEYS as readonly string[]).includes(message)
    ? (message as HouseholdErrorKey)
    : "generic";
}
