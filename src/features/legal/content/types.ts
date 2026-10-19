// Forma de los documentos legales (términos, privacidad...), en cada idioma.
import type { ReactNode } from "react";

export type LegalSection = {
  // Ancla para el índice (#cuenta, #menores...)
  id: string;
  title: string;
  body: ReactNode;
};

export type LegalDocument = {
  // Lo que se ve arriba: "Versión 1 · Última actualización: 8 de octubre de 2026"
  version: string;
  updated: string;
  // Resumen en pocas líneas (no sustituye al texto)
  summary: ReactNode[];
  sections: LegalSection[];
};
