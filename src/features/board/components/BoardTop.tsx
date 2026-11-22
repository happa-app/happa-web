"use client";
// Arriba del corcho: WiFi y Pagos lado a lado y, al tocar «QR», el QR debajo a todo el ancho (para que se
// pueda escanear bien). Los pagos llegan ya pintados desde el servidor (prop `payments`); los menores no los
// reciben y el WiFi ocupa entonces todo el ancho.
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import type { BoardWifi } from "../types";
import { CopyButton } from "./CopyButton";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  wifi: BoardWifi | null;
  // SVG del QR, hecho en el servidor
  qrSvg: string | null;
  canEdit: boolean;
  payments: ReactNode | null;
};

export function BoardTop({ householdId, wifi, qrSvg, canEdit, payments }: Props) {
  const t = useTranslations("Board");
  const [showQr, setShowQr] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const editLink = canEdit
    ? {
        href: `/hogar/${householdId}/corcho/wifi`,
        label: wifi ? t("wifi.edit") : t("wifi.add"),
        ariaLabel: wifi ? t("wifi.editAria") : t("wifi.addAria"),
      }
    : undefined;

  return (
    <>
      <div className={payments ? styles.pair : styles.single}>
        <Section title={t("wifi.title")} link={editLink}>
          {wifi ? (
            <div className={styles.wifi}>
              <p className={styles.ssid}>{wifi.ssid}</p>
              {wifi.security === "nopass" ? (
                <p className={styles.muted}>{t("wifi.noPassword")}</p>
              ) : (
                // Con puntos; al tocarla se ve
                <button
                  type="button"
                  className={styles.password}
                  aria-label={showPassword ? t("wifi.hidePassword") : t("wifi.showPassword")}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? wifi.password : "•".repeat(10)}
                </button>
              )}
              <div className={styles.pills}>
                {wifi.security === "nopass" ? null : (
                  <CopyButton text={wifi.password} ariaLabel={t("wifi.copyAria")} />
                )}
                {qrSvg ? (
                  <button
                    type="button"
                    className={showQr ? styles.pillOn : styles.pill}
                    aria-expanded={showQr}
                    aria-controls="wifi-qr"
                    onClick={() => setShowQr((v) => !v)}
                  >
                    {t("wifi.qr")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className={styles.empty}>{t("wifi.empty")}</p>
          )}
        </Section>
        {payments}
      </div>

      {wifi && qrSvg && showQr ? (
        <div id="wifi-qr" className={styles.qrPanel}>
          {/* El SVG lo genera nuestro servidor con la librería qrcode: solo trae dibujo, ningún texto del usuario */}
          <div className={styles.qr} role="img" aria-label={t("wifi.qrAlt", { ssid: wifi.ssid })} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className={styles.muted}>{t("wifi.qrHint", { ssid: wifi.ssid })}</p>
          <button type="button" className={styles.linkButton} onClick={() => setShowQr(false)}>
            {t("wifi.close")}
          </button>
        </div>
      ) : null}
    </>
  );
}
