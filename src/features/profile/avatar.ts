// La foto de perfil: dónde se guarda y cómo se llama. Son las mismas reglas que comprueba la base de
// datos (migración 18): siempre dentro de tu carpeta ("<tu id>/") y con un nombre al azar, nuevo cada vez.
// Vale en el servidor y en el navegador.
export const AVATAR_BUCKET = "avatars";
// La foto se guarda cuadrada, de este lado (en píxeles): unos 30-60 KB
export const AVATAR_SIZE = 512;
// Lo más grande que se acepta al elegirla (después se reduce)
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export type AvatarFormat = "webp" | "jpg";

// Dirección de una foto (null si no hay foto). El almacén es privado (migración 24): la foto se pide a
// nuestra ruta /api/avatar, que comprueba que quien la pide puede verla.
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/api/avatar/${encoded}`;
}

const NAME = /^[A-Za-z0-9_-]{8,64}\.(webp|jpg)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ¿Tiene la forma de una foto de alguien ("<id>/<nombre>.webp|jpg")?
export function isAvatarPath(path: string): boolean {
  const slash = path.indexOf("/");
  return slash > 0 && UUID.test(path.slice(0, slash)) && NAME.test(path.slice(slash + 1));
}

// ¿Es una ruta de foto válida dentro de la carpeta de esta persona?
export function isAvatarPathOf(path: string, userId: string): boolean {
  const slash = path.indexOf("/");
  return slash > 0 && path.slice(0, slash) === userId && NAME.test(path.slice(slash + 1));
}

// 32 letras al azar (0-9 a-f). Con getRandomValues, que funciona también sin https (crypto.randomUUID no:
// por ejemplo, al probar en el móvil con http://192.168...)
function randomName(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Ruta nueva para una foto (un nombre al azar: así el navegador nunca enseña la foto vieja)
export function newAvatarPath(userId: string, format: AvatarFormat, random: () => string = randomName): string {
  return `${userId}/${random().replace(/-/g, "")}.${format}`;
}
