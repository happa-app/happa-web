"use client";
// Formulario de "¿Has olvidado tu contraseña?". Envía el correo a la acción requestPasswordReset.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset } from "../actions";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

type Props = {
  // Vienes de un enlace de recuperación caducado o ya usado
  linkExpired?: boolean;
};

export function ForgotPasswordForm({ linkExpired = false }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialAuthState);

  if (state.status === "checkEmail") {
    return (
      <div className={styles.form}>
        <Alert tone="success" title={t("forgot.sentTitle")}>
          {t("forgot.sentText")}
        </Alert>
        <Link href="/login" className={styles.linkButton}>
          {t("forgot.backToLogin")}
        </Link>
      </div>
    );
  }

  const emailError = firstFieldError(state, "email");

  return (
    <form action={formAction} className={styles.form} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("forgot.title")}</h1>
        <p className={styles.subtitle}>{t("forgot.subtitle")}</p>
      </header>

      {linkExpired && state.status === "idle" ? <Alert tone="error">{t("errors.linkExpired")}</Alert> : null}
      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <input type="hidden" name="locale" value={locale} />

      <TextField
        label={t("fields.email")}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={emailError ? t(`errors.${emailError}`) : undefined}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("forgot.submitting") : t("forgot.submit")}
      </Button>

      <p className={styles.switch}>
        <Link href="/login">{t("forgot.backToLogin")}</Link>
      </p>
    </form>
  );
}
