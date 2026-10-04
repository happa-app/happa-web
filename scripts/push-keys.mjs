// Genera las claves para los avisos al móvil. Uso:  node scripts/push-keys.mjs
// Copia las cuatro primeras líneas en .env.local (y en Vercel → Settings → Environment Variables)
// y ejecuta la última en Supabase → SQL Editor (guarda el secreto en la base de datos).
// No subas estas claves a git. Si las cambias, cada uno tendrá que volver a activar los avisos.
import { generateKeyPairSync, randomBytes } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);
const secret = randomBytes(32).toString("base64url");

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${raw.toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log("VAPID_SUBJECT=mailto:info@happa.es");
console.log(`PUSH_DISPATCH_SECRET=${secret}`);
console.log("");
console.log("-- En Supabase → SQL Editor:");
console.log(
  `insert into private.secrets (name, value) values ('push_dispatch', '${secret}') on conflict (name) do update set value = excluded.value;`,
);
