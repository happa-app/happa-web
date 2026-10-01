// Reglas para añadir un producto. La base de datos comprueba lo mismo (migración 6).
import { z } from "zod";

export const newItemSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
  quantity: z
    .string()
    .trim()
    .max(20, "quantityTooLong")
    .transform((value) => (value === "" ? null : value)),
});

export type NewItemInput = z.input<typeof newItemSchema>;
