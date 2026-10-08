// Service worker de HAPPA: recibe los avisos al móvil, abre la app al tocarlos y, sin internet,
// enseña una página de "Sin conexión" en vez del error del navegador.
// Se registra al abrir la app (ServiceWorker.tsx) y también al activar los avisos.
// Solo se guarda la página sin conexión y su icono: nunca nada tuyo (las páginas de la app no se guardan).

const CACHE = "happa-offline-v1";
const OFFLINE_URL = "/offline.html";
const OFFLINE_FILES = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        // cache: "reload" para no guardar una copia vieja del navegador
        await cache.addAll(OFFLINE_FILES.map((url) => new Request(url, { cache: "reload" })));
      } catch (error) {
        // Sin la página sin conexión, pero lo demás (los avisos) tiene que seguir funcionando
        console.error("[sw] no se pudo guardar la página sin conexión:", error);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Fuera las versiones viejas de lo guardado
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("happa-") && n !== CACHE).map((n) => caches.delete(n)));
      // Así la página se pide a la vez que arranca el service worker (no lo hace más lento)
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// Solo al cambiar de página: siempre de internet; si no hay conexión, la página sin conexión.
// El resto (datos, imágenes, Supabase...) no pasa por aquí, salvo lo que usa esa página (su icono).
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") {
    const url = new URL(event.request.url);
    if (event.request.method === "GET" && url.origin === self.location.origin && OFFLINE_FILES.includes(url.pathname)) {
      event.respondWith(
        fetch(event.request).catch(async () => (await caches.match(url.pathname, { cacheName: CACHE })) || Response.error()),
      );
    }
    return;
  }
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(event.request);
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) || Response.error();
      }
    })(),
  );
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
        icon: "/icons/icon-192.png",
        // La silueta de la casa (Android la pinta en la barra de arriba)
        badge: "/icons/badge-96.png",
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
