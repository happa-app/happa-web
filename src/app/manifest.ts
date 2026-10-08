// El "manifest" de la app (/manifest.webmanifest): lo que el móvil necesita para instalar HAPPA como una
// app más, con su icono y su nombre, y abrirla a pantalla completa (sin la barra del navegador).
// Next lo enlaza solo en todas las páginas. Los iconos se generaron a partir de icono.png.
import type { MetadataRoute } from "next";
import { APP_BACKGROUND } from "@/lib/brand";
import es from "../../messages/es.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Happa",
    short_name: "Happa",
    description: es.Metadata.description,
    lang: "es",
    dir: "ltr",
    // La portada: con sesión, el proxy lleva a /inicio (y al idioma de cada uno)
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: APP_BACKGROUND,
    theme_color: APP_BACKGROUND,
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta estos con la forma de cada móvil (círculo, gota...): la casa va dentro de la zona segura
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
