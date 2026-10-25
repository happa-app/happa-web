"use client";
// Formulario de inicio de sesión. Envía los datos a la acción signIn (en el servidor).
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Captcha } from "@/components/ui/Captcha";
import { TextField } from "@/components/ui/TextField";
import { Link } from "@/i18n/navigation";
import { signIn } from "../actions";
import { GoogleButton } from "./GoogleButton";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

type Props = {
  confirmFailed?: boolean;
  // Vienes de borrar tu cuenta
  accountDeleted?: boolean;
  // Adónde volver después de entrar (por ejemplo, un enlace de invitación)
  next?: string;
  // No se pudo empezar a entrar con Google
  googleFailed?: boolean;
};

export function LoginForm({ confirmFailed = false, accountDeleted = false, next, googleFailed = false }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(signIn, initialAuthState);

  const emailError = firstFieldError(state, "email");
  const passwordError = firstFieldError(state, "password");

  return (
    <div className={styles.form}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("login.title")}</h1>
        <p className={styles.subtitle}>{t("login.subtitle")}</p>
      </header>
      {googleFailed && state.status === "idle" ? <Alert tone="error">{t("google.error")}</Alert> : null}
      <GoogleButton locale={locale} next={next} />
      <form action={formAction} className={styles.form} noValidate>
        {accountDeleted && state.status === "idle" ? <Alert tone="success">{t("accountDeleted")}</Alert> : null}
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
        <Link href="/recuperar" className={styles.forgot}>
          {t("login.forgot")}
        </Link>

        <Captcha resetKey={state} />

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
    </div>
  );
}
