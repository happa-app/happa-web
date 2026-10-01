// Tipo del cliente de Supabase de HAPPA (el del navegador y el del servidor son iguales).
// Sirve para escribir funciones que reciben el cliente y funcionan en los dos lados.
import type { createClient } from "./client";

export type AppSupabaseClient = ReturnType<typeof createClient>;
