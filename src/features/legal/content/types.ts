// Forma de los documentos legales (aviso legal, términos, privacidad y cookies), en cada idioma.
import type { ReactNode } from "react";

export type LegalSection = {
  // Ancla para el índice (#cuenta, #menores...)
  id: string;
  title: string;
  body: ReactNode;
};

export type LegalDocument = {
  // Lo que se ve arriba: "Versión 3 · Última actualización: 17 de noviembre de 2026"
  version: string;
  updated: string;
  // Título del resumen ("Lo esencial", "Información básica sobre protección de datos"...)
  summaryTitle: string;
  // Resumen en pocas líneas (no sustituye al texto). Vacío = sin resumen (el aviso legal no lo lleva)
  summary: ReactNode[];
  sections: LegalSection[];
};

// Los cuatro documentos. La clave es también la del título en messages/*.json (Legal.<clave>)
export type LegalDocumentKey = "notice" | "terms" | "privacy" | "cookies";
