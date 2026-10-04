// Avisos al móvil desde el navegador: activar o desactivar en este dispositivo, y pedir al servidor
// que envíe lo pendiente. Solo para componentes con "use client".
import { createClient } from "@/lib/supabase/client";

// La clave pública VAPID (la misma en todos los navegadores). Si falta, no se ofrece activar avisos.
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type DeviceState =
  | "loading"
  | "notConfigured" // faltan las claves en el servidor
  | "unsupported" // este navegador no puede
  | "ios" // iPhone/iPad: primero hay que añadir la app a la pantalla de inicio
  | "blocked" // el navegador tiene bloqueados los avisos de HAPPA
  | "off"
  | "on";

// Después de escribir en el chat o en la lista: que el servidor envíe los avisos a los móviles de los demás
export { requestPushDispatch } from "@/lib/push/request";

function isIosWithoutHomeScreen(): boolean {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!supported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function getDeviceState(): Promise<DeviceState> {
  if (!VAPID_PUBLIC_KEY) return "notConfigured";
  if (!supported()) return isIosWithoutHomeScreen() ? "ios" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return (await currentSubscription()) ? "on" : "off";
}

// (Sin tipo de vuelta a propósito: así TypeScript sabe que es un ArrayBuffer normal, como pide subscribe)
function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function keyOf(subscription: PushSubscription, name: "p256dh" | "auth"): string {
  const key = subscription.getKey(name);
  if (!key) throw new Error(`Falta la clave ${name}`);
  let text = "";
  new Uint8Array(key).forEach((b) => (text += String.fromCharCode(b)));
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Guarda (o vuelve a guardar) la suscripción de este navegador en la base de datos
async function saveSubscription(subscription: PushSubscription, locale: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: keyOf(subscription, "p256dh"),
    p_auth: keyOf(subscription, "auth"),
    p_locale: locale,
  });
  if (error) throw error;
}

// Activar: pide permiso, registra el service worker, se suscribe y lo guarda. Devuelve el estado final.
export async function enablePush(locale: string): Promise<DeviceState> {
  if (!VAPID_PUBLIC_KEY) return "notConfigured";
  if (!supported()) return isIosWithoutHomeScreen() ? "ios" : "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY) }));
  await saveSubscription(subscription, locale);
  return "on";
}

// Desactivar en este dispositivo
export async function disablePush(): Promise<DeviceState> {
  const subscription = await currentSubscription();
  if (subscription) {
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_push_subscription", { p_endpoint: subscription.endpoint });
    if (error) throw error;
    await subscription.unsubscribe();
  }
  return "off";
}

// Al abrir la app: si este navegador ya tenía los avisos activados, se vuelve a guardar (por si se
// borró de la base de datos o cambió el idioma). No pide nada al usuario.
export async function refreshSubscription(locale: string) {
  if (!VAPID_PUBLIC_KEY || !supported() || Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (subscription) await saveSubscription(subscription, locale);
}
