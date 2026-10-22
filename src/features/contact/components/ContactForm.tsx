"use client";
// Formulario de Más → Ayuda y contacto: qué es (error, pregunta, idea u otro) y el mensaje. Debajo, el
// correo por si alguien prefiere escribir desde su app de correo.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CONTACT_EMAIL } from "@/features/legal/owner";
import { Link } from "@/i18n/navigation";
import { submitWithoutReset } from "@/utils/forms";
import { sendContactMessage } from "../actions";
import { CONTACT_KINDS, CONTACT_MESSAGE_MAX, initialContactState, type ContactKind } from "../types";
import styles from "./Contact.module.css";

type Props = {
  // Tu correo: ahí te contestamos
  email: string;
  // El hogar desde el que escribes (si vienes de su pestaña Más)
  householdId?: string;
  // Adónde vuelve "Volver" al terminar
  backHref: string;
};

export function ContactForm({ email, householdId, backHref }: Props) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(sendContactMessage, initialContactState);
  const [kind, setKind] = useState<ContactKind>("bug");
  const [length, setLength] = useState(0);
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t("mailSubject"))}`;

  if (state.status === "sent") {
    return (
      <div className={styles.form}>
        <Alert tone="success" title={t("sentTitle")}>
          {t("sentText", { email })}
        </Alert>
        <Link href={backHref} className={styles.back}>
          {t("back")}
        </Link>
      </div>
    );
  }

  const messageError = state.error === "messageRequired" || state.error === "messageTooLong";

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.form} noValidate>
      {state.status === "error" && !messageError ? <Alert tone="error">{t(`errors.${state.error}`)}</Alert> : null}

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />
      {householdId ? <input type="hidden" name="householdId" value={householdId} /> : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{t("kindLabel")}</legend>
        <div className={styles.kinds} role="radiogroup" aria-label={t("kindLabel")}>
          {CONTACT_KINDS.map((k) => (
            <label key={k} className={kind === k ? styles.kindActive : styles.kind}>
              <input
                type="radio"
                name="kindChoice"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="visually-hidden"
              />
              {t(`kinds.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>
          {t("messageLabel")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={CONTACT_MESSAGE_MAX}
          defaultValue={state.message}
          placeholder={t(`placeholders.${kind}`)}
          onChange={(event) => setLength(event.target.value.length)}
          className={styles.textarea}
          aria-invalid={messageError ? true : undefined}
          aria-describedby="contact-message-help"
        />
        <p id="contact-message-help" className={messageError ? styles.error : styles.hint}>
          {messageError ? t(`errors.${state.error}`) : t("counter", { count: length, max: CONTACT_MESSAGE_MAX })}
        </p>
      </div>

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? t("sending") : t("send")}
      </Button>

      <p className={styles.mail}>
        {t.rich("orEmail", { email: () => <a href={mailto}>{CONTACT_EMAIL}</a> })}
      </p>
    </form>
  );
}
