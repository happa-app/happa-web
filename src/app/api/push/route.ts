// POST /api/push: envía al móvil los avisos pendientes. La llama el navegador después de escribir en el
// chat o en la lista de la compra (lo que se hace desde el navegador, sin pasar por el servidor).
// Solo con la sesión iniciada. No hace falta pasar nada: se envía lo que esté pendiente.
import { dispatchPush } from "@/lib/push/dispatch";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return Response.json({ ok: false }, { status: 401 });

  const result = await dispatchPush();
  return Response.json({ ok: true, ...result });
}
