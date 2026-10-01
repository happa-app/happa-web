// Enlace del correo de confirmación. Inicia la sesión y lleva a la app.
// Acepta los dos formatos de enlace de Supabase: con "code" (plantilla por defecto)
// y con "token_hash" (plantilla personalizada, la que usaremos con el SMTP propio).
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Solo se permite volver a rutas internas: evita que alguien use el enlace
// para mandar a la gente a una web externa.
function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/inicio";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
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

  if (confirmed) redirect(next);

  const loginPath = next === "/en" || next.startsWith("/en/") ? "/en/login" : "/login";
  redirect(`${loginPath}?error=confirm`);
}
