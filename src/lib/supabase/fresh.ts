// Una sesión aparte, de usar y tirar, para comprobar una contraseña sin tocar la del navegador.
// Es para lo delicado (cambiar la contraseña, borrar la cuenta): la base de datos pide además que la
// contraseña se haya escrito hace un momento (migración 18), y esta sesión lo demuestra.
// Usa la clave pública (anon), como todo lo demás: nunca la service_role.
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

function newClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type FreshClient = ReturnType<typeof newClient>;

export async function signInFresh(email: string, password: string) {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { client, error };
}

// Cierra la sesión aparte (si no se va a usar más)
export async function dropFresh(client: FreshClient): Promise<void> {
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) console.error("[sesión aparte] no se pudo cerrar:", error);
}
