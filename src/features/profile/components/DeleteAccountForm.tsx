"use client";
// El último paso para borrar la cuenta: confirmar que eres tú y "entiendo que no se puede deshacer".
// Se confirma con tu contraseña o, si entras con Google, volviendo a entrar con Google (o como prefieras,
// si tienes las dos). Al volver de Google, la pantalla ya lo sabe y solo falta la casilla.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Captcha } from "@/components/ui/Captcha";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { TextField } from "@/components/ui/TextField";
import { confirmWithGoogle, deleteAccount } from "../actions";
import { initialProfileState, type MyAccount } from "../types";
import styles from "./Profile.module.css";

type Props = {
  account: Pick<MyAccount, "hasPassword" | "hasGoogle" | "confirmedWithGoogle">;
  googleFailed: boolean;
};

export function DeleteAccountForm({ account, googleFailed }: Props) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(deleteAccount, initialProfileState);
  const errorFor = (field: string) =>
    state.status === "error" && state.field === field ? t(`errors.${state.error ?? "generic"}`) : undefined;
  const formError =
    state.status === "error" && !state.field ? <Alert tone="error">{t(`errors.${state.error ?? "generic"}`)}</Alert> : null;

  // Acaba de volver de Google: ya está confirmado, solo falta la casilla
  if (account.confirmedWithGoogle) {
    return (
      <form action={formAction} className={styles.form} noValidate>
        {formError}
        <Alert tone="success">{t("delete.googleConfirmed")}</Alert>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="method" value="google" />
        <CheckboxField name="confirm" label={t("delete.confirm")} error={errorFor("confirm")} />
        <Button type="submit" variant="danger" fullWidth disabled={isPending}>
          {isPending ? t("delete.deleting") : t("delete.submit")}
        </Button>
      </form>
    );
  }

  return (
    <>
      {googleFailed ? <Alert tone="error">{t("delete.googleError")}</Alert> : null}

      {account.hasPassword || !account.hasGoogle ? (
        <form action={formAction} className={styles.form} noValidate>
          {formError}
          <input type="hidden" name="locale" value={locale} />
          <TextField
            label={t("delete.password")}
            name="password"
            type="password"
            autoComplete="current-password"
            error={errorFor("password")}
          />
          <CheckboxField name="confirm" label={t("delete.confirm")} error={errorFor("confirm")} />
          <Captcha resetKey={state} />

          <Button type="submit" variant="danger" fullWidth disabled={isPending}>
            {isPending ? t("delete.deleting") : t("delete.submit")}
          </Button>
        </form>
      ) : null}

      {account.hasGoogle ? (
        <form action={confirmWithGoogle} className={styles.form}>
          <input type="hidden" name="locale" value={locale} />
          <p className={styles.formHint}>{account.hasPassword ? t("delete.orGoogle") : t("delete.withGoogle")}</p>
          <Button type="submit" variant="secondary" fullWidth>
            {t("delete.googleButton")}
          </Button>
        </form>
      ) : null}
    </>
  );
}
