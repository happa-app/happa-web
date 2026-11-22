"use client";
// Botón de "Copiar": copia el texto y durante un momento dice "Copiado".
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { copyText } from "@/utils/clipboard";
import styles from "./Board.module.css";

type Props = {
  text: string;
  // Para lectores de pantalla: qué se copia ("Copiar la contraseña del WiFi")
  ariaLabel: string;
  look?: "pill" | "link";
};

export function CopyButton({ text, ariaLabel, look = "pill" }: Props) {
  const t = useTranslations("Board");
  const [copied, setCopied] = useState(false);

  // "Copiado" se va solo a los 2 segundos
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className={look === "pill" ? styles.pill : styles.copyLink}
      aria-label={ariaLabel}
      onClick={async () => setCopied(await copyText(text))}
    >
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
