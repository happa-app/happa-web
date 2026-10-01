// Reglas para añadir un producto. La base de datos comprueba lo mismo (migraciones 6 y 7).
import { z } from "zod";

// Si no se escribe cantidad, se apunta 1. Como mucho, 99.
export const DEFAULT_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export const newItemSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
  // Llega como texto desde el formulario: solo cifras; vacío = 1
  quantity: z
    .string()
    .trim()
    .regex(/^\d*$/, "quantityInvalid")
    .transform((value) => (value === "" ? DEFAULT_QUANTITY : Number(value)))
    .pipe(z.number().min(1, "quantityInvalid").max(MAX_QUANTITY, "quantityInvalid")),
});

export type NewItemInput = z.input<typeof newItemSchema>;
