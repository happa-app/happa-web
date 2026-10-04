"use client";
// Avisos en este dispositivo: dice si están activados y deja activarlos o desactivarlos.
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { disablePush, enablePush, getDeviceState, type DeviceState } from "../push-client";
import styles from "./Notifications.module.css";

export function DevicePush() {
  const t = useTranslations("Notifications.device");
  const locale = useLocale();
  const [state, setState] = useState<DeviceState>("loading");
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getDeviceState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  async function run(action: () => Promise<DeviceState>) {
    setWorking(true);
    setFailed(false);
    try {
      setState(await action());
    } catch (e) {
      console.error("[avisos] no se pudo cambiar este dispositivo:", e);
      setFailed(true);
    } finally {
      setWorking(false);
    }
  }

  const message: Record<DeviceState, string> = {
    loading: t("loading"),
    notConfigured: t("notConfigured"),
    unsupported: t("unsupported"),
    ios: t("ios"),
    blocked: t("blocked"),
    off: t("off"),
    on: t("on"),
  };

  return (
    <section className={styles.card} aria-live="polite">
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={state === "on" ? styles.stateOn : state === "off" ? styles.stateOff : styles.muted}>{message[state]}</p>
      {state === "off" ? (
        <Button type="button" onClick={() => void run(() => enablePush(locale))} disabled={working} fullWidth>
          {working ? t("working") : t("enable")}
        </Button>
      ) : null}
      {state === "on" ? (
        <Button type="button" variant="secondary" onClick={() => void run(disablePush)} disabled={working} fullWidth>
          {working ? t("working") : t("disable")}
        </Button>
      ) : null}
      {failed ? (
        <p className={styles.error} role="alert">
          {t("error")}
        </p>
      ) : null}
    </section>
  );
}
