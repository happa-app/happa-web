"use client";
// Cambiar tu correo. Te llega un enlace al correo nuevo (y otro al de ahora): el cambio se hace al abrirlos.
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { changeEmail } from "../actions";
import { initialProfileState } from "../types";
import styles from "./Profile.module.css";

export function EmailForm({ email }: { email: string | null }) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(changeEmail, initialProfileState);
  const fieldError = state.status === "error" && state.field === "email" ? t(`errors.${state.error ?? "generic"}`) : undefined;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      {email ? (
        <p className={styles.current}>{t.rich("account.currentEmail", { email, strong: (chunks) => <strong>{chunks}</strong> })}</p>
      ) : null}
      {state.status === "error" && !state.field ? <Alert tone="error">{t(`errors.${state.error ?? "generic"}`)}</Alert> : null}
      {state.status === "done" ? <Alert tone="success">{t("account.emailSent", { email: state.email ?? "" })}</Alert> : null}
      <input type="hidden" name="locale" value={locale} />
      <TextField
        label={t("account.newEmail")}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        error={fieldError}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? t("sending") : t("account.changeEmail")}
      </Button>
    </form>
  );
}
