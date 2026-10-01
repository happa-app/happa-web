// Refresca la sesión del usuario en cada petición.
// Las páginas (Server Components) no pueden escribir cookies, así que el proxy
// renueva el token caducado y lo guarda en la respuesta.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

type PendingCookie = { name: string; value: string; options: CookieOptions };

export async function refreshSession(request: NextRequest) {
  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers?: Record<string, string>) {
          // Se actualizan en la petición (para lo que venga después) y se guardan
          // para copiarlos a la respuesta que se devuelva al navegador.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies.push(...cookiesToSet);
          Object.assign(pendingHeaders, headers ?? {});
        },
      },
    },
  );

  // IMPORTANTE: no pongas código entre createServerClient y getClaims().
  // getClaims() valida el token y dispara el refresco de la sesión si hace falta.
  const { data } = await supabase.auth.getClaims();

  return {
    isLoggedIn: Boolean(data?.claims),
    // Copia las cookies renovadas a la respuesta final, sea cual sea.
    applyTo<T extends NextResponse>(response: T): T {
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
      Object.entries(pendingHeaders).forEach(([key, value]) =>
        response.headers.set(key, value),
      );
      return response;
    },
  };
}
