// Claves del envío de avisos al móvil. Solo en el servidor: ninguna de estas variables empieza por
// NEXT_PUBLIC_ (salvo la clave pública VAPID, que tiene que conocer el navegador), así que Next.js nunca
// las mete en el código que llega al navegador.
//
// Variables (en .env.local y en Vercel):
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY · VAPID_SUBJECT · PUSH_DISPATCH_SECRET
// Se generan con: node scripts/push-keys.mjs
import type { PushKeys } from "./webpush";

export type PushConfig = PushKeys & { secret: string };

// null si falta algo: entonces no se envía nada al móvil (la app sigue funcionando y los avisos se ven en ella)
export function getPushConfig(): PushConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "";
  const secret = process.env.PUSH_DISPATCH_SECRET ?? "";
  if (
    !/^[A-Za-z0-9_-]{86,88}$/.test(publicKey) ||
    !/^[A-Za-z0-9_-]{42,44}$/.test(privateKey) ||
    !/^(mailto:|https:\/\/)/.test(subject) ||
    secret.length < 32
  ) {
    return null;
  }
  return { publicKey, privateKey, subject, secret };
}
