// Layout raíz: envuelve TODAS las páginas. Pone el idioma en <html> y carga los textos traducidos.
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { routing } from "@/i18n/routing";
import { APP_BACKGROUND } from "@/lib/brand";
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

// La barra de arriba del móvil, del color del fondo de la app
export const viewport: Viewport = {
  themeColor: APP_BACKGROUND,
};

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={geistSans.variable}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
