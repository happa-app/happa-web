"use client";
// Elegir el tema: igual que el dispositivo, claro u oscuro. Se guarda en este navegador (src/lib/theme.ts)
// y la app cambia al momento.
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { readThemeChoice, saveThemeChoice, subscribeThemeChoice, THEME_CHOICES } from "@/lib/theme";
import styles from "./Profile.module.css";

export function ThemePicker() {
  const t = useTranslations("Profile.theme");
  // Lo guardado en el navegador; en el servidor no se sabe, así que se pinta "igual que el dispositivo"
  // y se corrige nada más cargar
  const chosen = useSyncExternalStore(subscribeThemeChoice, readThemeChoice, () => "system");

  return (
    <fieldset className={styles.options}>
      <legend className="visually-hidden">{t("title")}</legend>
      {THEME_CHOICES.map((choice) => (
        <label key={choice} className={chosen === choice ? styles.optionOn : styles.option}>
          <input
            type="radio"
            name="theme"
            value={choice}
            className="visually-hidden"
            checked={chosen === choice}
            onChange={() => saveThemeChoice(choice)}
          />
          <span className={styles.optionName}>
            {t(`choices.${choice}`)}
            {choice === "system" ? <span className={styles.optionHint}>{t("systemHint")}</span> : null}
          </span>
          {chosen === choice ? (
            <span className={styles.optionCheck} aria-hidden="true">
              ✓
            </span>
          ) : null}
        </label>
      ))}
    </fieldset>
  );
}
