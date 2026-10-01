"use client";
// Código de invitación con botones para compartir el enlace o copiar el código.
// En el móvil abre el menú de compartir (WhatsApp, Telegram...); en el ordenador copia el enlace.
// El navegador solo permite copiar y compartir en páginas seguras (https o localhost):
// si no lo es (por ejemplo, probando desde el móvil con la IP del ordenador), se usa un
// método alternativo y, si tampoco funciona, se muestra el texto para copiarlo a mano.
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { localizePath, parseLocale } from "@/i18n/locale";
import { invitePath } from "../invite-code";
import styles from "./HouseholdDetail.module.css";

type Props = {
  code: string;
  householdName: string;
};

type Feedback = "copiedLink" | "copiedCode" | null;

async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Sin permiso: probamos el método alternativo
    }
  }

  // Método antiguo, que también funciona en páginas http
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

export function InvitePanel({ code, householdName }: Props) {
  const t = useTranslations("Households");
  const locale = parseLocale(useLocale());
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Texto que no se pudo copiar solo: se muestra para copiarlo a mano
  const [manualText, setManualText] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const inviteUrl = () => `${window.location.origin}${localizePath(invitePath(code), locale)}`;

  async function copy(textToCopy: string, done: Feedback) {
    if (await copyText(textToCopy)) {
      setManualText(null);
      setFeedback(done);
    } else {
      setFeedback(null);
      setManualText(textToCopy);
    }
  }

  async function share() {
    const url = inviteUrl();
    if (window.isSecureContext && navigator.share) {
      try {
        await navigator.share({ title: "HAPPA", text: t("invite.shareText", { name: householdName }), url });
      } catch {
        // Si se cancela el menú de compartir, no pasa nada.
      }
      return;
    }
    await copy(url, "copiedLink");
  }

  return (
    <div className={styles.invite}>
      <p className={styles.code} aria-label={t("invite.codeLabel")}>
        {code}
      </p>
      <div className={styles.inviteActions}>
        <Button type="button" onClick={share}>
          {t("invite.share")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => copy(code, "copiedCode")}>
          {t("invite.copyCode")}
        </Button>
      </div>
      {manualText ? (
        <label className={styles.manual}>
          <span>{t("invite.copyManually")}</span>
          <input
            className={styles.manualInput}
            readOnly
            value={manualText}
            onFocus={(event: { currentTarget: { select(): void } }) => event.currentTarget.select()}
            autoFocus
          />
        </label>
      ) : null}
      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback ? t(`invite.${feedback}`) : ""}
      </p>
    </div>
  );
}
