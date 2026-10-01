// Valida las variables de entorno UNA sola vez y las expone tipadas.
// Si falta alguna, la app falla al arrancar con un mensaje claro.
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url()
    .refine((u) => new URL(u).pathname === "/", "Usa solo https://TU-REFERENCIA.supabase.co, sin /rest/v1"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

// Hay que escribir process.env.NEXT_PUBLIC_... de forma literal (no con corchetes):
// Next solo las sustituye en el código del navegador si las ve escritas tal cual.
const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(
    "Faltan o son inválidas las variables de Supabase. Revisa .env.local (plantilla en .env.example).",
  );
}

export const env = parsed.data;
