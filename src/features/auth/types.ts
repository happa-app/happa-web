// Estado que devuelven las acciones de acceso a los formularios.
// Los errores son claves de traducción (Auth.errors.*), no textos.
export const AUTH_ERROR_KEYS = [
  "displayNameRequired",
  "displayNameTooLong",
  "emailInvalid",
  "passwordTooShort",
  "passwordTooLong",
  "passwordRequired",
  "passwordWeak",
  "mustAcceptLegal",
  "mustBeAdult",
  "invalidCredentials",
  "emailNotConfirmed",
  "rateLimited",
  "userExists",
  "generic",
] as const;

export type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];

export type AuthFormState = {
  status: "idle" | "error" | "checkEmail";
  fieldErrors?: Partial<Record<string, string[]>>;
  formError?: AuthErrorKey;
  // Lo que escribió la persona, para no vaciar el formulario si hay un error (nunca la contraseña)
  values?: { email?: string; displayName?: string };
};

export const initialAuthState: AuthFormState = { status: "idle" };

// Primer error de un campo, como clave conocida (si llega algo raro, "generic").
export function firstFieldError(
  state: AuthFormState,
  field: string,
): AuthErrorKey | undefined {
  const message = state.fieldErrors?.[field]?.[0];
  if (!message) return undefined;
  return (AUTH_ERROR_KEYS as readonly string[]).includes(message)
    ? (message as AuthErrorKey)
    : "generic";
}
