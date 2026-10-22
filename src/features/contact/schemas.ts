// Reglas del formulario de contacto. Se comprueban en el servidor; la base de datos vuelve a comprobarlas.
import { z } from "zod";
import { CONTACT_KINDS, CONTACT_MESSAGE_MAX } from "./types";

export const contactSchema = z.object({
  kind: z.enum(CONTACT_KINDS),
  message: z.string().trim().min(1, "messageRequired").max(CONTACT_MESSAGE_MAX, "messageTooLong"),
  // El hogar desde el que se escribe (opcional: si no eres de él, la base de datos no lo guarda)
  householdId: z.uuid().optional(),
});
