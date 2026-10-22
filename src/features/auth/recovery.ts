// Recuperar la contraseña: cómo se sabe que la sesión viene del enlace del correo y no de alguien que ya
// tenía la sesión abierta (por ejemplo, con tu móvil desbloqueado), que podría cambiarla sin saber la actual.
// Hacen falta dos cosas:
//   1. Una sesión recién creada con un enlace de un solo uso ("otp" en el token, firmado por Supabase).
//      El de confirmar el registro también es "otp": por eso no basta solo con esto.
//   2. La cookie que pone /auth/confirm al abrir el enlace de recuperación, con el id de la cuenta.
// Las dos caducan a los 15 minutos. Solo para el servidor (páginas, acciones y rutas).
import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";

export const RECOVERY_COOKIE = "happa_recovery";
export const RECOVERY_MAX_AGE = 15 * 60; // segundos
export const NEW_PASSWORD_PATH = "/nueva-contrasena";
export const FORGOT_PASSWORD_PATH = "/recuperar";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function setRecoveryCookie(userId: string) {
  (await cookies()).set(RECOVERY_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RECOVERY_MAX_AGE,
  });
}

export async function clearRecoveryCookie() {
  (await cookies()).delete(RECOVERY_COOKIE);
}

export async function hasRecoverySession(supabase: ServerClient): Promise<boolean> {
  const marked = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (!marked) return false;

  // getClaims comprueba la firma del token: no se puede falsificar desde el navegador
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data || data.claims.sub !== marked) return false;

  const now = Math.floor(Date.now() / 1000);
  const amr = (data.claims.amr ?? []) as { method?: string; timestamp?: number }[];
  return amr.some((entry) => entry.method === "otp" && now - (entry.timestamp ?? 0) <= RECOVERY_MAX_AGE);
}
