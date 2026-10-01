// Acepta el código suelto o el enlace completo (https://happa.es/unirse/abc123)
// y devuelve solo el código, en minúsculas y sin espacios.
export function normalizeInviteCode(input: string): string {
  const trimmed = input.trim();
  const fromLink = trimmed.match(/\/unirse\/([^/?#\s]+)/i);
  return (fromLink ? fromLink[1] : trimmed).replace(/\s+/g, "").toLowerCase();
}

// Ruta del enlace de invitación (sin idioma ni dominio).
export function invitePath(code: string): string {
  return `/unirse/${code}`;
}
