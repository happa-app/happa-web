"use client";
// El último paso para borrar la cuenta: tu contraseña y "entiendo que no se puede deshacer".
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { TextField } from "@/components/ui/TextField";
import { deleteAccount } from "../actions";
import { initialProfileState } from "../types";
import styles from "./Profile.module.css";

export function DeleteAccountForm() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(deleteAccount, initialProfileState);
  const errorFor = (field: string) =>
    state.status === "error" && state.field === field ? t(`errors.${state.error ?? "generic"}`) : undefined;

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.status === "error" && !state.field ? <Alert tone="error">{t(`errors.${state.error ?? "generic"}`)}</Alert> : null}
      <input type="hidden" name="locale" value={locale} />
      <TextField
        label={t("delete.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        error={errorFor("password")}
      />
      <CheckboxField name="confirm" label={t("delete.confirm")} error={errorFor("confirm")} />
      <Button type="submit" variant="danger" fullWidth disabled={isPending}>
        {isPending ? t("delete.deleting") : t("delete.submit")}
      </Button>
    </form>
  );
}
