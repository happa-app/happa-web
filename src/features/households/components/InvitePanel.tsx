"use client";
// Código de invitación con botones para compartir el enlace o copiar el código.
// En el móvil abre el menú de compartir (WhatsApp, Telegram...); en el ordenador copia el enlace.
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

export function InvitePanel({ code, householdName }: Props) {
  const t = useTranslations("Households");
  const locale = parseLocale(useLocale());
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const inviteUrl = () => `${window.location.origin}${localizePath(invitePath(code), locale)}`;

  async function copy(textToCopy: string, done: Feedback) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setFeedback(done);
    } catch {
      // Navegadores antiguos o sin permiso: no hacemos nada, el código sigue a la vista.
    }
  }

  async function share() {
    const url = inviteUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "HAPPA", text: t("invite.shareText", { name: householdName }), url });
        return;
      } catch {
        // Si se cancela el menú de compartir, no pasa nada.
        return;
      }
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
      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback ? t(`invite.${feedback}`) : ""}
      </p>
    </div>
  );
}
