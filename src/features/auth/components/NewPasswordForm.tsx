"use client";
// Formulario de la contraseña nueva, después de abrir el enlace del correo. Envía a la acción setNewPassword.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Link } from "@/i18n/navigation";
import { setNewPassword } from "../actions";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

type Props = {
  // El correo de la cuenta, para que se vea qué contraseña se está cambiando
  email: string;
};

export function NewPasswordForm({ email }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(setNewPassword, initialAuthState);

  const error = (field: string) => {
    const key = firstFieldError(state, field);
    return key ? t(`errors.${key}`) : undefined;
  };

  return (
    <form action={formAction} className={styles.form} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("newPassword.title")}</h1>
        <p className={styles.subtitle}>{t("newPassword.subtitle", { email })}</p>
      </header>

      {state.formError ? (
        <Alert tone="error">
          {t(`errors.${state.formError}`)}
          {state.formError === "linkExpired" ? (
            <>
              {" "}
              <Link href="/recuperar">{t("newPassword.askAgain")}</Link>
            </>
          ) : null}
        </Alert>
      ) : null}

      <input type="hidden" name="locale" value={locale} />
      {/* Para que el gestor de contraseñas del móvil sepa de qué cuenta es la contraseña nueva */}
      <input type="hidden" name="username" autoComplete="username" value={email} />

      <TextField
        label={t("fields.newPassword")}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint={t("fields.passwordHint")}
        error={error("password")}
      />
      <TextField
        label={t("fields.repeatPassword")}
        name="repeat"
        type="password"
        autoComplete="new-password"
        required
        error={error("repeat")}
      />

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("newPassword.submitting") : t("newPassword.submit")}
      </Button>
    </form>
  );
}
