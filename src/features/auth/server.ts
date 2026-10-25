// Solo para páginas y acciones del servidor.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export { hasRecoverySession } from "./recovery";

// ¿Le falta a quien tiene la sesión terminar el registro (entró con Google y no ha aceptado los términos)?
// (migración 22). cache(): el layout y la página de bienvenida lo preguntan una sola vez por visita.
export const needsSignupCompletion = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("needs_signup_completion");
  if (error) {
    console.error("[auth] no se pudo comprobar el registro:", error);
    return false;
  }
  return data === true;
});
