// Reglas del perfil (las mismas que al crear la cuenta y que la base de datos).
import { z } from "zod";

// De 1 a 60 caracteres
export const displayNameSchema = z.string().trim().min(1, "nameRequired").max(60, "nameTooLong");

export const emailSchema = z.email("emailInvalid");

// Como al crear la cuenta: de 8 a 72 caracteres
export const newPasswordSchema = z.string().min(8, "passwordTooShort").max(72, "passwordTooLong");
