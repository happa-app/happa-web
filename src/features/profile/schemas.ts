// Reglas del perfil (las mismas que al crear la cuenta y que la base de datos: de 1 a 60 caracteres).
import { z } from "zod";

export const displayNameSchema = z.string().trim().min(1, "nameRequired").max(60, "nameTooLong");
