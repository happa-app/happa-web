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

// Recuperar la contraseña: el correo al que mandar el enlace
export const forgotPasswordSchema = z.object({
  email: z.email("emailInvalid"),
});

// Contraseña nueva (después de abrir el enlace): las mismas reglas que al registrarse, escrita dos veces
export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "passwordTooShort").max(72, "passwordTooLong"),
    repeat: z.string(),
  })
  .refine((data) => data.repeat === data.password, { message: "passwordMismatch", path: ["repeat"] });

export type LoginInput = z.infer<typeof loginSchema>;
// "Antes de empezar" (/bienvenida): lo del registro que Google no nos da (nombre, términos y edad)
export const completeSignupSchema = z.object({
  displayName: z.string().trim().min(1, "displayNameRequired").max(60, "displayNameTooLong"),
  acceptLegal: z.literal(true, "mustAcceptLegal"),
  isAdult: z.literal(true, "mustBeAdult"),
});

export type SignupInput = z.infer<typeof signupSchema>;
