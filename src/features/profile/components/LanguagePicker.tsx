"use client";
// Elegir el idioma. Se guarda en tu perfil (también para los avisos al móvil) y la app cambia al momento.
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { saveLanguage } from "../actions";
import { LANGUAGE_NAMES } from "../languages";
import styles from "./Profile.module.css";

export function LanguagePicker({ current }: { current: Locale }) {
  const t = useTranslations("Profile.language");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<Locale>(current);
  const [failed, setFailed] = useState(false);

  function choose(locale: Locale) {
    if (locale === chosen) return;
    setChosen(locale);
    setFailed(false);
    startTransition(async () => {
      const result = await saveLanguage(locale).catch(() => ({ ok: false }));
      if (!result.ok) {
        setChosen(current);
        setFailed(true);
        return;
      }
      // La misma página, en el otro idioma (y la app lo recuerda en este navegador)
      router.replace(pathname, { locale });
    });
  }

  return (
    <>
      {failed ? <Alert tone="error">{t("error")}</Alert> : null}
      <fieldset className={styles.options} disabled={pending}>
        <legend className="visually-hidden">{t("title")}</legend>
        {routing.locales.map((locale) => (
          <label key={locale} className={chosen === locale ? styles.optionOn : styles.option}>
            <input
              type="radio"
              name="language"
              value={locale}
              className="visually-hidden"
              checked={chosen === locale}
              onChange={() => choose(locale)}
            />
            <span lang={locale} className={styles.optionName}>
              {LANGUAGE_NAMES[locale]}
            </span>
            {chosen === locale ? (
              <span className={styles.optionCheck} aria-hidden="true">
                ✓
              </span>
            ) : null}
          </label>
        ))}
      </fieldset>
    </>
  );
}
