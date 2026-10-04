// Web Push sin librerías: cifra el aviso para un navegador (RFC 8291, "aes128gcm") y firma la petición
// con las claves VAPID de la app (RFC 8292). Solo se usa en el servidor.
// Probado con el ejemplo oficial del RFC 8291 (mismas claves → mismo resultado, byte a byte).
import { createCipheriv, createECDH, createPrivateKey, hkdfSync, randomBytes, sign } from "node:crypto";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

export type PushKeys = {
  // Clave pública VAPID (65 bytes en base64url, la misma que NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  publicKey: string;
  // Clave privada VAPID (32 bytes en base64url)
  privateKey: string;
  // Contacto para los servicios de push, por ejemplo "mailto:info@happa.es"
  subject: string;
};

// Solo se envía a los servicios de push de los navegadores (lo mismo que comprueba la base de datos):
// así nadie puede apuntar una dirección cualquiera para que el servidor le haga peticiones.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^[a-z0-9.-]+\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export function isAllowedEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && url.port === "" && !url.username && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

export function toBase64Url(data: Uint8Array): string {
  return Buffer.from(data).toString("base64url");
}

export function fromBase64Url(text: string): Buffer {
  return Buffer.from(text, "base64url");
}

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  return Buffer.from(hkdfSync("sha256", ikm, salt, info, length));
}

// Cifra el contenido para un navegador. Devuelve el cuerpo listo para enviar (cabecera + datos cifrados).
// test: claves y "sal" fijas, solo para comprobarlo con el ejemplo del RFC.
export function encryptPayload(
  plaintext: Buffer,
  userAgentPublicKey: Buffer,
  authSecret: Buffer,
  test: { serverPrivateKey?: Buffer; salt?: Buffer } = {},
): Buffer {
  const ecdh = createECDH("prime256v1");
  if (test.serverPrivateKey) ecdh.setPrivateKey(test.serverPrivateKey);
  else ecdh.generateKeys();
  const serverPublicKey = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(userAgentPublicKey);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0", "utf8"), userAgentPublicKey, serverPublicKey]);
  const ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);
  const salt = test.salt ?? randomBytes(16);
  const contentKey = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0", "utf8"), 16);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0", "utf8"), 12);

  const cipher = createCipheriv("aes-128-gcm", contentKey, nonce);
  // Un solo bloque: el contenido y el byte 2 que marca el último
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([serverPublicKey.length]), serverPublicKey, encrypted]);
}

// Cabecera Authorization firmada con las claves VAPID (vale 12 horas)
export function vapidAuthorization(endpoint: string, keys: PushKeys, now: number = Date.now()): string {
  const json = (value: object) => toBase64Url(Buffer.from(JSON.stringify(value), "utf8"));
  const header = json({ typ: "JWT", alg: "ES256" });
  const claims = json({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: keys.subject });
  const publicKey = fromBase64Url(keys.publicKey);
  const privateKey = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: keys.privateKey,
      x: toBase64Url(publicKey.subarray(1, 33)),
      y: toBase64Url(publicKey.subarray(33, 65)),
    },
    format: "jwk",
  });
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`, "utf8"), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${claims}.${toBase64Url(signature)}, k=${keys.publicKey}`;
}

export type SendOptions = {
  // Cuánto tiempo guarda el aviso el servicio de push si el móvil está apagado (segundos)
  ttl: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  // Avisos con el mismo "topic" se sustituyen en el servicio de push si aún no se habían entregado
  topic?: string;
};

// Envía un aviso a un navegador. Devuelve el código de respuesta (201 = enviado; 404 o 410 = ese
// navegador ya no existe y hay que olvidarlo).
export async function sendWebPush(
  target: PushTarget,
  payload: string,
  keys: PushKeys,
  options: SendOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  if (!isAllowedEndpoint(target.endpoint)) return 400;
  const body = encryptPayload(Buffer.from(payload, "utf8"), fromBase64Url(target.p256dh), fromBase64Url(target.auth));
  const headers: Record<string, string> = {
    Authorization: vapidAuthorization(target.endpoint, keys),
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    TTL: String(options.ttl),
    Urgency: options.urgency ?? "normal",
  };
  if (options.topic) headers.Topic = options.topic;
  const response = await fetchImpl(target.endpoint, { method: "POST", headers, body: new Uint8Array(body), redirect: "manual" });
  return response.status;
}
