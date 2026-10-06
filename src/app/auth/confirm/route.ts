// Enlace del correo de confirmación. Inicia la sesión y lleva a la app.
// Acepta los dos formatos de enlace de Supabase: con "code" (plantilla por defecto)
// y con "token_hash" (plantilla personalizada, la que usaremos con el SMTP propio).
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
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
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let confirmed = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmed = !error;
  }

  if (confirmed || emailChange) redirect(next);

  const loginPath = next === "/en" || next.startsWith("/en/") ? "/en/login" : "/login";
  redirect(`${loginPath}?error=confirm`);
}
