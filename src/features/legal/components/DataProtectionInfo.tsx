// "Información básica sobre protección de datos": la primera capa que recomienda la AEPD, junto al formulario
// de registro. Plegada y en letra pequeña, para no agobiar; lo completo está en la política de privacidad
// (segunda capa).
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LEGAL_OWNER, PRIVACY_EMAIL } from "../owner";
import styles from "./DataProtectionInfo.module.css";

const ROWS = ["controller", "purpose", "basis", "recipients", "rights"] as const;

export function DataProtectionInfo() {
  const t = useTranslations("Legal.basicInfo");
  // El nombre del titular si ya está en las variables de entorno (../owner.ts); si no, uno genérico
  const owner = LEGAL_OWNER.name ?? t("controller.fallback");

  return (
    <details className={styles.box}>
      <summary className={styles.title}>{t("title")}</summary>
      <dl className={styles.rows}>
        {ROWS.map((row) => (
          <div key={row} className={styles.row}>
            <dt>{t(`${row}.label`)}</dt>
            <dd>{t(`${row}.value`, { email: PRIVACY_EMAIL, owner })}</dd>
          </div>
        ))}
        <div className={styles.row}>
          <dt>{t("more.label")}</dt>
          <dd>
            {t.rich("more.value", {
              link: (chunks) => (
                <Link href="/legal/privacidad" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </dd>
        </div>
      </dl>
    </details>
  );
}
