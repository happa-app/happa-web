"use client";
// Formulario de registro. Envía los datos a la acción signUp (en el servidor).
import { useLocale, useTranslations } from "next-intl";
import { useActionState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { TextField } from "@/components/ui/TextField";
import { Link } from "@/i18n/navigation";
import { signUp } from "../actions";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

export function SignupForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(signUp, initialAuthState);

  if (state.status === "checkEmail") {
    return (
      <div className={styles.form}>
        <Alert tone="success" title={t("signup.checkEmailTitle")}>
          {t("signup.checkEmailText")}
        </Alert>
        <Link href="/login" className={styles.linkButton}>
          {t("signup.backToLogin")}
        </Link>
      </div>
    );
  }

  const error = (field: string) => {
    const key = firstFieldError(state, field);
    return key ? t(`errors.${key}`) : undefined;
  };

  const legalLabel = t.rich("fields.acceptLegal", {
    terms: (chunks: ReactNode) => (
      <Link href="/legal/terminos" target="_blank">
        {chunks}
      </Link>
    ),
    privacy: (chunks: ReactNode) => (
      <Link href="/legal/privacidad" target="_blank">
        {chunks}
      </Link>
    ),
  });

  return (
    <form action={formAction} className={styles.form} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("signup.title")}</h1>
        <p className={styles.subtitle}>{t("signup.subtitle")}</p>
      </header>

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <input type="hidden" name="locale" value={locale} />

      <TextField
        label={t("fields.displayName")}
        name="displayName"
        autoComplete="given-name"
        maxLength={60}
        required
        hint={t("fields.displayNameHint")}
        defaultValue={state.values?.displayName}
        error={error("displayName")}
      />
      <TextField
        label={t("fields.email")}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={error("email")}
      />
      <TextField
        label={t("fields.password")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint={t("fields.passwordHint")}
        error={error("password")}
      />

      <CheckboxField name="acceptLegal" label={legalLabel} error={error("acceptLegal")} />
      <CheckboxField name="isAdult" label={t("fields.isAdult")} error={error("isAdult")} />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("signup.submitting") : t("signup.submit")}
      </Button>

      <p className={styles.switch}>
        {t("signup.haveAccount")} <Link href="/login">{t("signup.goToLogin")}</Link>
      </p>
    </form>
  );
}
