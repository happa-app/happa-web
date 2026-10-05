"use client";
// Cambiar tu nombre. Sale "Guardado" al terminar (hasta que vuelvas a cambiar algo).
import { useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { updateDisplayName } from "../actions";
import { initialProfileState } from "../types";
import styles from "./Profile.module.css";

export function ProfileForm({ name }: { name: string }) {
  const t = useTranslations("Profile");
  const [state, formAction, isPending] = useActionState(updateDisplayName, initialProfileState);
  const [value, setValue] = useState(name);
  // ¿Se ha cambiado algo desde la última respuesta? (entonces no se enseña "Guardado" ni el error)
  const [edited, setEdited] = useState({ state, changed: false });
  const fresh = !(edited.state === state && edited.changed);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      <TextField
        label={t("name")}
        name="name"
        value={value}
        maxLength={60}
        autoComplete="nickname"
        hint={t("nameHint")}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setEdited({ state, changed: true });
          setValue(e.target.value);
        }}
        error={state.status === "error" && fresh ? t(`errors.${state.error ?? "generic"}`) : undefined}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("saving") : t("save")}
      </Button>
      {state.status === "done" && fresh ? (
        <p className={styles.saved} role="status">
          {t("saved")}
        </p>
      ) : null}
    </form>
  );
}
