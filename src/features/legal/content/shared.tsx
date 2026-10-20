// Piezas comunes de los documentos legales (términos y privacidad).
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { LEGAL_OWNER } from "../owner";
import styles from "../components/LegalPage.module.css";

export type Lang = "es" | "en";

const PENDING: Record<keyof typeof LEGAL_OWNER, Record<Lang, string>> = {
  name: { es: "nombre o razón social", en: "name or company name" },
  taxId: { es: "NIF", en: "tax ID" },
  address: { es: "domicilio", en: "address" },
  registry: { es: "datos registrales", en: "registry details" },
};

// Un dato del titular, o "[pendiente: …]" si aún no está en las variables de entorno (ver ../owner.ts)
export function Owner({ field, lang }: { field: keyof typeof LEGAL_OWNER; lang: Lang }) {
  const value = LEGAL_OWNER[field];
  if (value) return <>{value}</>;
  return <mark className={styles.pending}>[{lang === "es" ? "pendiente" : "pending"}: {PENDING[field][lang]}]</mark>;
}

export function Mail({ to }: { to: string }) {
  return <a href={`mailto:${to}`}>{to}</a>;
}

export function TermsLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/terminos">{children}</Link>;
}

export function PrivacyLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/privacidad">{children}</Link>;
}
