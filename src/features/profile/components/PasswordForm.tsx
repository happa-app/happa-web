"use client";
// Cambiar tu contraseña: la actual y la nueva dos veces. Al terminar, el formulario se vacía.
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { changePassword } from "../actions";
import { initialProfileState } from "../types";
import styles from "./Profile.module.css";

export function PasswordForm() {
  const t = useTranslations("Profile");
  const [state, formAction, isPending] = useActionState(changePassword, initialProfileState);
  const errorFor = (field: string) =>
    state.status === "error" && state.field === field ? t(`errors.${state.error ?? "generic"}`) : undefined;

  return (
    // Con "action", React vacía el formulario al terminar (las contraseñas no se quedan escritas)
    <form action={formAction} className={styles.form} noValidate>
      {state.status === "error" && !state.field ? <Alert tone="error">{t(`errors.${state.error ?? "generic"}`)}</Alert> : null}
      {state.status === "done" ? <Alert tone="success">{t("account.passwordChanged")}</Alert> : null}
      <TextField
        label={t("account.currentPassword")}
        name="current"
        type="password"
        autoComplete="current-password"
        error={errorFor("current")}
      />
      <TextField
        label={t("account.newPassword")}
        name="next"
        type="password"
        autoComplete="new-password"
        maxLength={72}
        hint={t("account.newPasswordHint")}
        error={errorFor("next")}
      />
      <TextField
        label={t("account.repeatPassword")}
        name="repeat"
        type="password"
        autoComplete="new-password"
        maxLength={72}
        error={errorFor("repeat")}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("saving") : t("account.changePassword")}
      </Button>
    </form>
  );
}
