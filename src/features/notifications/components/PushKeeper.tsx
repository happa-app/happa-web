"use client";
// Invisible. Al abrir la app, si este navegador ya tenía los avisos al móvil activados, vuelve a guardar
// su suscripción (por si se borró o cambió el idioma). No pide permiso ni enseña nada.
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { refreshSubscription } from "../push-client";

export function PushKeeper() {
  const locale = useLocale();
  useEffect(() => {
    refreshSubscription(locale).catch((e) => console.error("[avisos] no se pudo poner al día el móvil:", e));
  }, [locale]);
  return null;
}
