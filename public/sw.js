// Service worker de HAPPA: recibe los avisos al móvil y abre la app al tocarlos.
// Se registra desde Avisos → Ajustes al activar los avisos en este dispositivo.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Ruta interna de la app (sin dominio). Cualquier otra cosa lleva al inicio.
function safePath(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/inicio";
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const url = safePath(data.url);

  event.waitUntil(
    (async () => {
      // Si ya estás mirando esa misma pantalla (por ejemplo, el chat), no hace falta avisar
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const looking = windows.some((client) => {
        try {
          return client.focused && client.visibilityState === "visible" && new URL(client.url).pathname === url;
        } catch {
          return false;
        }
      });
      if (looking) return;

      await self.registration.showNotification(data.title || "HAPPA", {
        body: data.body || "",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safePath(event.notification.data && event.notification.data.url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Si la app ya está abierta, se usa esa ventana
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
