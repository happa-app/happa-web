// Enlace de vuelta de Auth: los correos (confirmar el registro, cambiar el correo y recuperar la contraseña)
// y al volver de Google. Inicia la sesión y lleva a la app (o, la primera vez con Google, a /bienvenida).
// Acepta los dos formatos de enlace de Supabase: con "code" (plantilla por defecto) y con "token_hash"
// (las de supabase/templates). El de "code" solo funciona en el navegador donde se pidió el correo; el de
// "token_hash", en cualquiera (te registras en el ordenador y abres el correo en el móvil).
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { FORGOT_PASSWORD_PATH, setRecoveryCookie } from "@/features/auth/recovery";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/utils/safe-path";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Solo se permite volver a rutas internas: evita que alguien use el enlace
  // para mandar a la gente a una web externa.
  const next = safeNextPath(searchParams.get("next")) ?? "/inicio";
  // Cambio de correo: con "Secure email change" hay dos enlaces (uno en cada correo). El primero vuelve
  // sin código ("message"), y el segundo puede abrirse en otro móvil (sin la cookie del código). Supabase
  // ya ha hecho su parte antes de volver aquí, así que se va siempre a Tu cuenta, que le pregunta a
  // Supabase cómo ha quedado.
  const emailChange = searchParams.get("flow") === "email";
  // Recuperar la contraseña: se marca la sesión para que /nueva-contrasena sepa que viene de este enlace
  const recovery = searchParams.get("flow") === "recovery";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let userId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user.id;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) userId = data.user.id;
  }

  const prefix = next === "/en" || next.startsWith("/en/") ? "/en" : "";

  if (userId && recovery) await setRecoveryCookie(userId);
  // Primera vez con Google: antes de nada, aceptar los términos (y después, adonde iba)
  if (userId && !recovery) {
    const { data: pending } = await supabase.rpc("needs_signup_completion");
    if (pending) redirect(`${prefix}/bienvenida?next=${encodeURIComponent(next)}`);
  }
  if (userId || emailChange) redirect(next);

  // Enlace de recuperación caducado o ya usado: a pedir otro
  if (recovery) redirect(`${prefix}${FORGOT_PASSWORD_PATH}?error=caducado`);
  redirect(`${prefix}/login?error=confirm`);
}
