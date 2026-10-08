import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Conecta next-intl con src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.*.*", "172.17.103.58"],

  // Cabeceras de seguridad (las que recomienda la guía de PWA de Next)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // El navegador no adivina el tipo de un archivo (que una "foto" no se ejecute como código)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nadie puede meter HAPPA dentro de su web (evita que te engañen para pulsar algo)
          { key: "X-Frame-Options", value: "DENY" },
          // A otras webs solo les llega el dominio de donde vienes, no la página
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // El service worker: siempre la última versión y solo con código de HAPPA
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
