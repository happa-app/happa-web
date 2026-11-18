// Páginas legales (/legal/aviso-legal, /legal/terminos, /legal/privacidad y /legal/cookies): el logo y el
// documento en tu idioma.
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { COOKIES } from "../content/cookies";
import { NOTICE } from "../content/notice";
import { PRIVACY } from "../content/privacy";
import type { Lang } from "../content/shared";
import { TERMS } from "../content/terms";
import type { LegalDocument, LegalDocumentKey } from "../content/types";
import { LegalDocumentView } from "./LegalDocumentView";
import styles from "./LegalPage.module.css";

const DOCUMENTS: Record<LegalDocumentKey, Record<Lang, LegalDocument>> = {
  notice: NOTICE,
  terms: TERMS,
  privacy: PRIVACY,
  cookies: COOKIES,
};

export async function LegalPage({ document }: { document: LegalDocumentKey }) {
  const t = await getTranslations("Legal");
  const doc = DOCUMENTS[document][(await getLocale()) === "en" ? "en" : "es"];

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logoLink}>
        <Logo />
      </Link>
      <LegalDocumentView
        title={t(document)}
        doc={doc}
        labels={{
          meta: t("meta", { version: doc.version, updated: doc.updated }),
          summaryNote: t("summaryNote"),
          contents: t("contents"),
        }}
      />
    </main>
  );
}
