// Layout raíz: envuelve TODAS las páginas. Pone el idioma en <html> y carga los textos traducidos.
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { routing } from "@/i18n/routing";
import { APP_BACKGROUND, APP_BACKGROUND_DARK } from "@/lib/brand";
import { THEME_SCRIPT } from "@/lib/theme";
import "@/styles/globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
    applicationName: "Happa",
    // Al añadirla a la pantalla de inicio del iPhone: su nombre y que se abra como una app
    appleWebApp: { capable: true, title: "Happa", statusBarStyle: "default" },
  };
}

// La barra de arriba del móvil, del color del fondo de la app (según el tema del dispositivo; si eliges
// uno en Perfil → Tema, el script de THEME_SCRIPT lo cambia)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: APP_BACKGROUND },
    { media: "(prefers-color-scheme: dark)", color: APP_BACKGROUND_DARK },
  ],
};

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    // suppressHydrationWarning: el script del tema pone data-theme en <html> antes de que React llegue, y
    // eso no es un error
    <html lang={locale} className={geistSans.variable} suppressHydrationWarning>
      <head>
        {/* El tema antes de pintar nada (src/lib/theme.ts) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
