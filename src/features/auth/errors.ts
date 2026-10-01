// Traduce los errores de Supabase Auth a claves de mensaje propias.
// Nunca se muestra el texto original de Supabase (está en inglés y puede dar pistas a un atacante).
import type { AuthErrorKey } from "./types";

export function toAuthErrorKey(error: { code?: string; status?: number }): AuthErrorKey {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "weak_password":
      return "passwordWeak";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "email_address_invalid":
      return "emailInvalid";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
      console.error("[auth] error sin traducir:", error);
      return error.status === 429 ? "rateLimited" : "generic";
  }
}
