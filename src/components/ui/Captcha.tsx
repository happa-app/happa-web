"use client";
// Comprobación de que no eres un robot (Cloudflare Turnstile), para los formularios que Supabase protege con
// captcha: registro, login, recuperar la contraseña y los que vuelven a pedir la contraseña en Perfil.
//
// Casi siempre es invisible: Turnstile mira el navegador y solo enseña una casilla si duda. Cuando termina,
// mete en el formulario un campo oculto ("cf-turnstile-response") con un código de un solo uso, que la
// acción del servidor le pasa a Supabase (captchaToken en src/lib/captcha.ts).
//
// Si no hay clave (NEXT_PUBLIC_TURNSTILE_SITE_KEY), no se pinta nada y los formularios funcionan como
// siempre: así se puede publicar el código antes de activar el captcha en Supabase.
import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import styles from "./Captcha.module.css";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Lo poco que usamos del script de Turnstile (lo añade a window al cargarse)
type Turnstile = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// El script se carga una sola vez, aunque haya varios formularios
let loading: Promise<Turnstile> | null = null;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

type Props = {
  // Cuando cambia (por ejemplo, el estado que devuelve la acción), se pide un código nuevo: cada código
  // vale una sola vez, y si el envío falla (contraseña mal) hace falta otro para volver a probar.
  resetKey?: unknown;
};

export function Captcha({ resetKey }: Props) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const firstKey = useRef(resetKey);

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    const element = container.current;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId.current = turnstile.render(element, {
          sitekey: SITE_KEY,
          // Solo se ve si Turnstile necesita que hagas algo
          appearance: "interaction-only",
          size: "flexible",
          theme: "light",
          language: locale,
          "refresh-expired": "auto",
        });
      })
      // Si no carga (sin conexión, un bloqueador…), Supabase rechazará el envío y se avisa allí
      .catch(() => console.error("[captcha] no se pudo cargar Turnstile"));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale]);

  useEffect(() => {
    if (resetKey === firstKey.current) return;
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={container} className={styles.captcha} />;
}
