// Dirección de la web (localhost en desarrollo, happa.es en producción), para los enlaces de los correos.
// Supabase solo acepta enlaces de vuelta que estén en su lista de URLs permitidas.
import { headers } from "next/headers";

export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}
