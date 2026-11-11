// GET /api/avatar/<id>/<archivo>: entrega una foto de perfil. El almacén "avatars" es privado (migración 24):
// la descargamos con la sesión de quien la pide, así que Supabase solo la da si es suya o de alguien de sus
// hogares. Si no puede verla (o no existe), 404 y la app enseña la inicial.
import { AVATAR_BUCKET, isAvatarPath } from "@/features/profile/avatar";
import { createClient } from "@/lib/supabase/server";

const TYPES = { webp: "image/webp", jpg: "image/jpeg" } as const;

// Respuesta de error que no se guarda en ninguna caché: si mañana entras en su hogar, la foto ya sale
function fail(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/avatar/[...path]">) {
  const { path: parts } = await ctx.params;
  const path = parts.join("/");
  // Solo rutas con la forma de una foto ("<id>/<nombre>.webp|jpg"): nada de otras carpetas
  if (!isAvatarPath(path)) return fail(404);

  const supabase = await createClient();
  // Comprueba la sesión (y la renueva si ha caducado) antes de pedir el archivo
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return fail(401);

  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).download(path);
  if (error || !data) {
    // Supabase responde 400/404 tanto si no existe como si no puedes verla (no dice cuál, a propósito).
    // Cualquier otra cosa es un fallo suyo o de la red: 502, para no confundirlo con "no tienes permiso".
    const status = error && "status" in error ? error.status : undefined;
    return fail(status === 400 || status === 404 ? 404 : 502);
  }

  const ext = path.slice(path.lastIndexOf(".") + 1) as keyof typeof TYPES;
  return new Response(data, {
    headers: {
      "Content-Type": TYPES[ext],
      // "private": solo la guarda el navegador de esta persona, nunca una caché compartida. Un día: cada foto
      // nueva tiene un nombre nuevo, así que nunca se ve una vieja; y si alguien sale del hogar, deja de verla
      // como mucho al día siguiente.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
