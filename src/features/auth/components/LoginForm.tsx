"use client";
// Formulario de inicio de sesión. Envía los datos a la acción signIn (en el servidor).
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Link } from "@/i18n/navigation";
import { signIn } from "../actions";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

type Props = {
  confirmFailed?: boolean;
  // Adónde volver después de entrar (por ejemplo, un enlace de invitación)
  next?: string;
};

export function LoginForm({ confirmFailed = false, next }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(signIn, initialAuthState);

  const emailError = firstFieldError(state, "email");
  const passwordError = firstFieldError(state, "password");

  return (
    <form action={formAction} className={styles.form} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("login.title")}</h1>
        <p className={styles.subtitle}>{t("login.subtitle")}</p>
      </header>

      {confirmFailed && state.status === "idle" ? (
        <Alert tone="error">{t("confirmError")}</Alert>
      ) : null}
      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
      <TextField
        label={t("fields.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={passwordError ? t(`errors.${passwordError}`) : undefined}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("login.submitting") : t("login.submit")}
      </Button>

      <p className={styles.switch}>
        {t("login.noAccount")}{" "}
        <Link href={{ pathname: "/registro", query: next ? { next } : undefined }}>
          {t("login.goToSignup")}
        </Link>
      </p>
    </form>
  );
}
