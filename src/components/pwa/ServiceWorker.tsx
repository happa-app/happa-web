"use client";
// Registra el service worker (public/sw.js) al abrir cualquier página. Con él, el móvil ofrece instalar
// HAPPA como app y, sin internet, se ve la página "Sin conexión". Los avisos al móvil usan el mismo.
// No pinta nada.
import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    // Solo en https (o localhost): en http://192.168... el navegador no lo permite
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
        console.error("[pwa] no se pudo registrar el service worker:", error);
      });
    };
    // Después de cargar la página, para no quitarle velocidad
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
