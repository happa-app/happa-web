// Envía al móvil los avisos pendientes. Lo llaman el servidor después de las acciones que crean avisos
// (gastos, tareas) y la ruta /api/push (después de escribir en el chat o en la lista de la compra).
//
// Cómo funciona:
//  1. Pide a la base de datos los avisos pendientes (push_claim, con el secreto). La base de datos los
//     marca como enviados al dárnoslos, así que aunque se llame dos veces a la vez, cada uno sale una vez.
//  2. Escribe el texto en el idioma de cada móvil y lo envía cifrado a su servicio de push.
//  3. Si el servicio dice que ese móvil ya no existe (404 o 410), se olvida (push_forget).
// Usa la clave pública (anon) de Supabase: no hace falta la service_role.
import { createClient } from "@supabase/supabase-js";
import { createTranslator, type Messages } from "next-intl";
import { localizedUrl, notificationPhrase } from "@/features/notifications/text";
import type { NotificationData, NotificationType } from "@/features/notifications/types";
import { env } from "@/lib/env";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { getPushConfig } from "./config";
import { sendWebPush } from "./webpush";

type ClaimRow = {
  notification_id: string;
  type: NotificationType;
  data: NotificationData;
  url: string;
  ref_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string;
};

export type PushPayload = { title: string; body: string; url: string; tag: string };

const BATCH = 50;
const MAX_ROUNDS = 4;

// El aviso tal y como se ve en el móvil
export function buildPushPayload(row: Pick<ClaimRow, "notification_id" | "type" | "data" | "url" | "ref_id">, locale: string): PushPayload {
  const lang = locale === "en" ? "en" : "es";
  // Con el tipo "Messages" de next-intl los textos se comprueban igual que con useTranslations
  // (así se le pueden pasar valores a una clave que se elige al momento, como "types.message")
  const messages: Messages = lang === "en" ? en : es;
  const t = createTranslator({ locale: lang, messages, namespace: "Notifications" });
  const phrase = notificationPhrase(row, lang, t("someone"));
  return {
    title: row.data.household || "HAPPA",
    body: t(phrase.key, phrase.values),
    url: localizedUrl(row.url, lang),
    // Los del mismo chat se sustituyen en el móvil (solo se ve el último)
    tag: row.type === "message" && row.ref_id ? `chat-${row.ref_id}` : `n-${row.notification_id}`,
  };
}

export async function dispatchPush(fetchImpl: typeof fetch = fetch): Promise<{ sent: number; failed: number; gone: number }> {
  const result = { sent: 0, failed: 0, gone: 0 };
  const config = getPushConfig();
  if (!config) return result;
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const { data, error } = await supabase.rpc("push_claim", { p_secret: config.secret, p_limit: BATCH });
    if (error) {
      // "Not allowed": falta poner el secreto en la base de datos (ver la migración 14)
      console.error("[push] no se pudieron coger los avisos pendientes:", error.message);
      break;
    }
    const rows = (data ?? []) as ClaimRow[];
    if (rows.length === 0) break;

    const gone: string[] = [];
    await Promise.all(
      rows.map(async (row) => {
        try {
          const payload = buildPushPayload(row, row.locale);
          const status = await sendWebPush(
            { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
            JSON.stringify(payload),
            config,
            {
              ttl: row.type === "message" ? 3600 : 86400,
              urgency: row.type === "message" ? "high" : "normal",
              topic: row.type === "message" && row.ref_id ? `chat${row.ref_id.replace(/-/g, "").slice(0, 28)}` : undefined,
            },
            fetchImpl,
          );
          if (status === 404 || status === 410) {
            gone.push(row.endpoint);
            result.gone += 1;
          } else if (status >= 200 && status < 300) {
            result.sent += 1;
          } else {
            result.failed += 1;
            console.error("[push] el servicio de push respondió", status);
          }
        } catch (e) {
          result.failed += 1;
          console.error("[push] no se pudo enviar un aviso:", e);
        }
      }),
    );

    if (gone.length > 0) {
      const { error: forgetError } = await supabase.rpc("push_forget", { p_secret: config.secret, p_endpoints: gone });
      if (forgetError) console.error("[push] no se pudieron olvidar móviles:", forgetError.message);
    }
    // Menos filas de las pedidas: ya no queda nada (cada aviso puede ir a varios móviles)
    if (new Set(rows.map((r) => r.notification_id)).size < BATCH) break;
  }
  return result;
}
