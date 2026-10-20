// Páginas legales (/legal/terminos y /legal/privacidad): el logo y el documento en tu idioma.
// Si un documento aún no tiene texto, enseña que está en preparación.
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { PRIVACY } from "../content/privacy";
import { TERMS } from "../content/terms";
import type { LegalDocument } from "../content/types";
import { LegalDocumentView } from "./LegalDocumentView";
import styles from "./LegalPage.module.css";

type Props = {
  document: "terms" | "privacy";
};

function documentFor(document: Props["document"], locale: string): LegalDocument | null {
  const lang = locale === "en" ? "en" : "es";
  return document === "terms" ? TERMS[lang] : PRIVACY[lang];
}

export async function LegalPage({ document }: Props) {
  const t = await getTranslations("Legal");
  const doc = documentFor(document, await getLocale());

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logoLink}>
        <Logo />
      </Link>
      {doc ? (
        <LegalDocumentView
          title={t(document)}
          doc={doc}
          labels={{
            meta: t("meta", { version: doc.version, updated: doc.updated }),
            summaryTitle: t("summaryTitle"),
            summaryNote: t("summaryNote"),
            contents: t("contents"),
          }}
        />
      ) : (
        <article className={styles.card}>
          <h1 className={styles.title}>{t(document)}</h1>
          <p>{t("draftNotice")}</p>
        </article>
      )}
    </main>
  );
}
