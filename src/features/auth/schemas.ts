// Reglas de los formularios de acceso. Se comprueban en el servidor (nunca te fíes del navegador).
// Los mensajes son claves de traducción de messages/*.json → Auth.errors.
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "displayNameRequired")
    .max(60, "displayNameTooLong"),
  email: z.email("emailInvalid"),
  password: z.string().min(8, "passwordTooShort").max(72, "passwordTooLong"),
  acceptLegal: z.literal(true, "mustAcceptLegal"),
  isAdult: z.literal(true, "mustBeAdult"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
