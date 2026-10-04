// Pide al servidor que envíe a los móviles los avisos pendientes. Se llama desde el navegador después de
// escribir en el chat o en la lista de la compra (esas cosas no pasan por el servidor de la app).
// Si los avisos al móvil no están configurados (falta la clave pública), no hace nada.
export function requestPushDispatch() {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  void fetch("/api/push", { method: "POST", keepalive: true }).catch(() => {});
}
