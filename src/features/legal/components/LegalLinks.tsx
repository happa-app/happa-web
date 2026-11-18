// Enlaces pequeños a los textos legales (aviso legal, términos, privacidad y cookies). La ley pide que se puedan
// encontrar fácilmente: salen en la portada y en "Más".
import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LegalDocumentKey } from "../content/types";
import styles from "./LegalLinks.module.css";

const LINKS: { key: LegalDocumentKey; href: string }[] = [
  { key: "notice", href: "/legal/aviso-legal" },
  { key: "terms", href: "/legal/terminos" },
  { key: "privacy", href: "/legal/privacidad" },
  { key: "cookies", href: "/legal/cookies" },
];

export function LegalLinks() {
  const t = useTranslations("Legal");
  return (
    <nav className={styles.links} aria-label={t("linksLabel")}>
      {LINKS.map(({ key, href }, i) => (
        <Fragment key={key}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <Link href={href}>{t(key)}</Link>
        </Fragment>
      ))}
    </nav>
  );
}
