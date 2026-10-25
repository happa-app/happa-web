"use client";
// "Antes de empezar" (/bienvenida): lo que pide el registro y Google no nos da. El nombre (ya puesto con el
// de Google), aceptar los términos y la privacidad, confirmar la edad y las dos casillas opcionales, igual
// que en el registro. Lo guarda la acción completeSignup.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { TextField } from "@/components/ui/TextField";
// Directo del componente: el índice de legal también exporta LegalPage, que solo funciona en el servidor
import { DataProtectionInfo } from "@/features/legal/components/DataProtectionInfo";
import { Link } from "@/i18n/navigation";
import { completeSignup } from "../actions";
import { firstFieldError, initialAuthState } from "../types";
import styles from "./AuthForm.module.css";

type Props = {
  // El nombre que dio Google
  name: string;
  email: string;
  // Adónde ir después (por ejemplo, un enlace de invitación)
  next?: string;
};

export function WelcomeForm({ name, email, next }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(completeSignup, initialAuthState);

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
        <h1 className={styles.title}>{t("welcome.title")}</h1>
        <p className={styles.subtitle}>{t("welcome.subtitle", { email })}</p>
      </header>

      {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <TextField
        label={t("fields.displayName")}
        name="displayName"
        autoComplete="given-name"
        maxLength={60}
        required
        hint={t("fields.displayNameHint")}
        defaultValue={state.values?.displayName ?? name}
        error={error("displayName")}
      />

      <CheckboxField name="acceptLegal" label={legalLabel} error={error("acceptLegal")} />
      <CheckboxField name="isAdult" label={t("fields.isAdult")} error={error("isAdult")} />

      {/* Opcionales y desmarcadas, igual que en el registro (ver SignupForm) */}
      <CheckboxField name="marketing" label={t("fields.marketing")} />
      <div>
        <CheckboxField name="partners" label={t("fields.partners")} />
        <details className={styles.more}>
          <summary>{t("fields.partnersMore")}</summary>
          <p>{t("fields.partnersDetail")}</p>
        </details>
      </div>

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("welcome.submitting") : t("welcome.submit")}
      </Button>

      <DataProtectionInfo />
    </form>
  );
}
