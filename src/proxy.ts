// Se ejecuta antes de cada petición (en Next.js 16 se llama proxy.ts; antes, middleware.ts).
// Hace tres cosas, en este orden:
//   1. Refresca la sesión de Supabase.
//   2. Protege las rutas privadas: todo es privado salvo lo que esté en PUBLIC_*.
//   3. Pone el idioma en la URL (español sin prefijo, inglés con /en).
import { hasLocale } from "next-intl";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { localizePath } from "@/i18n/locale";
import { routing, type Locale } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/proxy";
import { safeNextPath } from "@/utils/safe-path";

const handleI18nRouting = createIntlMiddleware(routing);

// Rutas que se pueden ver sin sesión. Cualquier ruta nueva es privada por defecto.
const PUBLIC_PATHS = ["/", "/login", "/registro"];
const PUBLIC_PREFIXES = ["/legal"];
// Con sesión iniciada, estas rutas llevan directamente a la app.
const GUEST_ONLY_PATHS = ["/", "/login", "/registro"];
const LOGIN_PATH = "/login";
const HOME_PATH = "/inicio";

function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (hasLocale(routing.locales, first)) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function isPublic(path: string) {
  return (
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  );
}

export async function proxy(request: NextRequest) {
  const session = await refreshSession(request);

  // Rutas técnicas (confirmar el correo): solo la sesión, sin idioma.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return session.applyTo(NextResponse.next({ request }));
  }

  const { locale, path } = splitLocale(request.nextUrl.pathname);

  // Sin sesión en una ruta privada: al login, recordando adónde iba
  // (así un enlace de invitación sigue funcionando después de entrar).
  if (!session.isLoggedIn && !isPublic(path)) {
    const url = new URL(localizePath(LOGIN_PATH, locale), request.url);
    if (path !== HOME_PATH) {
      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    }
    return session.applyTo(NextResponse.redirect(url));
  }

  // Con sesión en login, registro o portada: directo a la app (o adonde iba).
  if (session.isLoggedIn && GUEST_ONLY_PATHS.includes(path)) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const target = next ?? localizePath(HOME_PATH, locale);
    return session.applyTo(NextResponse.redirect(new URL(target, request.url)));
  }

  return session.applyTo(handleI18nRouting(request));
}

export const config = {
  // Todo menos /api, archivos internos de Next y rutas con punto (favicon.ico, imágenes...).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
