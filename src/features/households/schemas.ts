// Reglas de los formularios de hogares. Se comprueban en el servidor.
import { z } from "zod";
import { HOUSEHOLD_KINDS } from "./types";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
  kind: z.enum(HOUSEHOLD_KINDS, "kindRequired"),
});

export const inviteCodeSchema = z.string().regex(/^[a-z0-9]{6,32}$/, "codeInvalid");

export const householdIdSchema = z.uuid();
