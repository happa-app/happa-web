// Cliente de Supabase para el SERVIDOR (páginas, Server Actions y rutas).
// Lee la sesión del usuario desde las cookies de la petición.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Desde una página (Server Component) no se pueden escribir cookies.
            // Se puede ignorar: el proxy ya se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
