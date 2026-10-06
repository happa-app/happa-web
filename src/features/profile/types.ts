// Tipos del perfil
import type { Locale } from "@/i18n/routing";

export type MyProfile = {
  userId: string;
  name: string;
  // La foto: ruta en el almacén y su dirección pública (null si no hay)
  avatarPath: string | null;
  avatarUrl: string | null;
  email: string | null;
  locale: Locale;
  // Cuándo se creó la cuenta (ISO)
  memberSince: string;
  isMinor: boolean;
};

// Lo tuyo en todos tus hogares (migración 18)
export type MyStats = {
  choresDone: number;
  paidCents: number;
  messagesSent: number;
  rouletteChosen: number;
};

// Hogares (actuales o que dejaste) con saldo (negativo = debes; positivo = te deben) o con gastos y
// pagos tuyos sin confirmar
export type PendingBalance = {
  householdId: string;
  name: string;
  netCents: number;
  pending: number;
};

// Tu cuenta, preguntada a Supabase: el correo y, si lo estás cambiando, el nuevo (falta abrir un enlace)
export type MyAccount = {
  email: string | null;
  newEmail: string | null;
};

// Errores que pueden ver los usuarios (claves de messages/*.json → Profile.errors)
export const PROFILE_ERROR_KEYS = [
  "nameRequired",
  "nameTooLong",
  "emailInvalid",
  "sameEmail",
  "emailTaken",
  "passwordRequired",
  "wrongPassword",
  "passwordTooShort",
  "passwordTooLong",
  "passwordMismatch",
  "samePassword",
  "passwordWeak",
  "confirmRequired",
  "owesMoney",
  "pendingMoney",
  "minor",
  "rateLimited",
  "generic",
] as const;
export type ProfileErrorKey = (typeof PROFILE_ERROR_KEYS)[number];

export type ProfileFormState = {
  status: "idle" | "done" | "error";
  error?: ProfileErrorKey;
  // El campo del error (si no hay, el error es de todo el formulario)
  field?: string;
  // Cambio de correo: a qué correo se ha mandado el enlace
  email?: string;
};

export const initialProfileState: ProfileFormState = { status: "idle" };

// Errores al elegir y subir la foto (claves de Profile.photo.errors)
export type PhotoErrorKey = "notImage" | "tooBig" | "cantOpen" | "uploadFailed" | "generic";
