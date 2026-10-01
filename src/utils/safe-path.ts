// Devuelve la ruta solo si es interna de la app (empieza por "/" pero no por "//").
// Evita las "redirecciones abiertas": que un enlace manipulado mande a alguien a otra web
// después de iniciar sesión.
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\r\n]/.test(value) || value.length > 512) return null;
  return value;
}
