"use client";
// Perfil → Privacidad: los dos interruptores (novedades de HAPPA y ofertas de empresas colaboradoras), cada uno
// por su lado. Cambian al momento; si no se puede guardar, vuelven a como estaban y se avisa.
// El texto de cada uno (y el detalle de qué se comparte) es el mismo de las casillas del registro (Auth.fields):
// es el que tiene versión (PRIVACY_CHOICES_VERSION) y el que se guarda como aceptado.
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { PRIVACY_PURPOSES, type PrivacyPurpose } from "@/features/legal/versions";
import { savePrivacyChoice } from "../actions";
import type { MyPrivacyChoices } from "../types";
import styles from "./Profile.module.css";

type Props = {
  initial: MyPrivacyChoices;
  // Las cuentas de menor no pueden aceptar nada de esto
  isMinor: boolean;
};

export function PrivacyChoices({ initial, isMinor }: Props) {
  const t = useTranslations("Profile.privacy");
  const tFields = useTranslations("Auth.fields");
  const locale = useLocale();
  const [choices, setChoices] = useState(initial);
  const [saving, setSaving] = useState<PrivacyPurpose | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

  function toggle(purpose: PrivacyPurpose, granted: boolean) {
    const before = choices[purpose];
    setChoices((current) => ({ ...current, [purpose]: { ...current[purpose], granted } }));
    setSaving(purpose);
    setFailed(false);
    startTransition(async () => {
      const result = await savePrivacyChoice(purpose, granted).catch(() => ({ ok: false, changedAt: undefined }));
      if (result.ok && result.changedAt) {
        setChoices((current) => ({ ...current, [purpose]: { granted, changedAt: result.changedAt ?? null } }));
      } else {
        setChoices((current) => ({ ...current, [purpose]: before }));
        setFailed(true);
      }
      setSaving(null);
    });
  }

  if (isMinor) return <p className={styles.privacyNote}>{t("minor")}</p>;

  return (
    <>
      {failed ? <Alert tone="error">{t("error")}</Alert> : null}
      <ul className={styles.privacyList}>
        {PRIVACY_PURPOSES.map((purpose) => {
          const choice = choices[purpose];
          const id = `privacy-${purpose}`;
          return (
            <li key={purpose} className={styles.privacyItem}>
              <div className={styles.privacyText}>
                <label htmlFor={id} className={styles.privacyTitle}>
                  {tFields(purpose)}
                </label>
                {purpose === "partners" ? (
                  <details className={styles.privacyMore}>
                    <summary>{tFields("partnersMore")}</summary>
                    <p>{tFields("partnersDetail")}</p>
                  </details>
                ) : null}
                <p className={styles.privacyDate}>
                  {choice.changedAt ? t("changedAt", { date: date(choice.changedAt) }) : t("neverDecided")}
                </p>
              </div>
              <input
                id={id}
                type="checkbox"
                role="switch"
                className={styles.switch}
                checked={choice.granted}
                disabled={saving !== null}
                onChange={(event) => toggle(purpose, event.target.checked)}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
