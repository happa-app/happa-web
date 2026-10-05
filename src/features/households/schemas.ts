// Reglas de los formularios de hogares. Se comprueban en el servidor.
import { z } from "zod";
import { MAX_PLACES, MIN_PLACES } from "./places";
import { HOUSEHOLD_KINDS } from "./types";

// Plazas: un número entero de 1 a 20 (se escribe en un campo, así que llega como texto)
export const placesSchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}$/, "placesInvalid")
  .transform(Number)
  .pipe(z.number().int().min(MIN_PLACES, "placesInvalid").max(MAX_PLACES, "placesInvalid"));

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
  kind: z.enum(HOUSEHOLD_KINDS, "kindRequired"),
  places: placesSchema,
});

export const inviteCodeSchema = z.string().regex(/^[a-z0-9]{6,32}$/, "codeInvalid");

export const householdIdSchema = z.uuid();
