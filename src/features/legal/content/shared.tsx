// Piezas comunes de los documentos legales (aviso legal, términos, privacidad y cookies).
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { LEGAL_OWNER } from "../owner";
import styles from "../components/LegalPage.module.css";

export type Lang = "es" | "en";

// El titular es una persona física: nombre y apellidos, NIF y domicilio (sin datos registrales)
const PENDING: Record<keyof typeof LEGAL_OWNER, Record<Lang, string>> = {
  name: { es: "nombre y apellidos", en: "full name" },
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

// Una tabla con cabecera. Va dentro de una caja con desplazamiento horizontal propio: en el móvil, si no cabe,
// se desliza la tabla y no toda la página.
export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                // La primera columna es el nombre de la fila (ayuda a los lectores de pantalla)
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Enlaces entre los documentos
export function NoticeLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/aviso-legal">{children}</Link>;
}

export function TermsLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/terminos">{children}</Link>;
}

export function PrivacyLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/privacidad">{children}</Link>;
}

export function CookiesLink({ children }: { children: ReactNode }) {
  return <Link href="/legal/cookies">{children}</Link>;
}
