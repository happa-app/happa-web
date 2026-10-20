// Páginas legales (/legal/...): que los buscadores no las muestren. Llevan el nombre, el NIF y el domicilio del
// titular (LSSI): tienen que poder verse desde la web, pero así no salen al buscar esos datos en Google.
// "follow" deja que sigan los enlaces que hay en ellas.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  return children;
}
