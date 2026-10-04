"use client";
// Qué tipos de avisos llegan al móvil (en la app siempre se ven todos).
import { useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { submitWithoutReset } from "@/utils/forms";
import { savePreferences } from "../actions";
import { initialNotificationsActionState, NOTIFICATION_CATEGORIES, type NotificationPreferences } from "../types";
import styles from "./Notifications.module.css";

export function PreferencesForm({ preferences }: { preferences: NotificationPreferences }) {
  const t = useTranslations("Notifications");
  const [state, formAction, isPending] = useActionState(savePreferences, initialNotificationsActionState);
  const [values, setValues] = useState(preferences);
  // ¿Se ha cambiado algo desde la última respuesta? (entonces no se enseña "Guardado")
  const [edited, setEdited] = useState({ state, changed: false });
  const changedSinceSave = edited.state === state && edited.changed;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.card}>
      <h2 className={styles.sectionTitle}>{t("settings.categoriesTitle")}</h2>
      <p className={styles.muted}>{t("settings.categoriesHint")}</p>
      <div>
        {NOTIFICATION_CATEGORIES.map((category) => (
          <label key={category} className={styles.switchRow}>
            <span>{t(`categories.${category}`)}</span>
            <input
              type="checkbox"
              name={category}
              checked={values[category]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEdited({ state, changed: true });
                setValues({ ...values, [category]: e.target.checked });
              }}
            />
          </label>
        ))}
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("settings.saving") : t("settings.save")}
      </Button>
      {state.status === "done" && !changedSinceSave ? (
        <p className={styles.saved} role="status">
          {t("settings.saved")}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {t("errors.generic")}
        </p>
      ) : null}
    </form>
  );
}
