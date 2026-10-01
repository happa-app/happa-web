// Cliente de Supabase para el NAVEGADOR (componentes con "use client").
// Es el equivalente a tu createClient() de JavaScript puro, pero tipado con tus tablas.
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
