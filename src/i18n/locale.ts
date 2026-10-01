// Utilidades de idioma que se usan en varias partes (proxy, acciones de servidor, componentes).
import { hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";

// Idioma enviado por un formulario. Si no es válido, el idioma por defecto (español).
export function parseLocale(value: unknown): Locale {
  return typeof value === "string" && hasLocale(routing.locales, value)
    ? value
    : routing.defaultLocale;
}

// Añade el prefijo de idioma a una ruta: "/inicio" → "/inicio" (es) o "/en/inicio" (en).
export function localizePath(path: string, locale: Locale): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
