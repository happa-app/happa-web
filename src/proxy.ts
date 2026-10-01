// Se ejecuta antes de cada petición (en Next.js 16 se llama proxy.ts; antes, middleware.ts).
// Hace tres cosas, en este orden:
//   1. Refresca la sesión de Supabase.
//   2. Protege las rutas privadas: todo es privado salvo lo que esté en PUBLIC_*.
//   3. Pone el idioma en la URL (español sin prefijo, inglés con /en).
import { hasLocale } from "next-intl";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, type Locale } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/proxy";

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

function localizePath(path: string, locale: Locale) {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
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

  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(target, locale);
    url.search = "";
    return session.applyTo(NextResponse.redirect(url));
  };

  if (!session.isLoggedIn && !isPublic(path)) return redirectTo(LOGIN_PATH);
  if (session.isLoggedIn && GUEST_ONLY_PATHS.includes(path)) return redirectTo(HOME_PATH);

  return session.applyTo(handleI18nRouting(request));
}

export const config = {
  // Todo menos /api, archivos internos de Next y rutas con punto (favicon.ico, imágenes...).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
