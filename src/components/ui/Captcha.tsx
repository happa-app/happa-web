"use client";
// Comprobación de que no eres un robot (Cloudflare Turnstile), para los formularios que Supabase protege con
// captcha: registro, login, recuperar la contraseña y los que vuelven a pedir la contraseña en Perfil.
//
// Casi siempre es invisible: Turnstile mira el navegador y solo enseña una casilla si duda. Cuando termina,
// mete en el formulario un campo oculto ("cf-turnstile-response") con un código de un solo uso, que la
// acción del servidor le pasa a Supabase (captchaToken en src/lib/captcha.ts).
//
// Si se envía el formulario antes de que Turnstile termine (pasa mucho con la contraseña autocompletada), no se
// manda todavía: espera al código y se envía solo, con un aviso de "comprobando" mientras tanto.
//
// Si no hay clave (NEXT_PUBLIC_TURNSTILE_SITE_KEY), no se pinta nada y los formularios funcionan como
// siempre: así se puede publicar el código antes de activar el captcha en Supabase.
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Cuánto se espera al código antes de dejar pasar el envío (sin código, Supabase lo rechaza y se ve el aviso)
const MAX_WAIT_MS = 15_000;

export function Captcha({ resetKey }: Props) {
  const t = useTranslations("Captcha");
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const firstKey = useRef(resetKey);
  // waiting: aún no hay código · ready: ya lo hay · failed: Turnstile no ha podido (se deja enviar igual)
  const status = useRef<"waiting" | "ready" | "failed">("waiting");
  // Un envío que llegó antes que el código (por ejemplo, con la contraseña autocompletada): se repite solo
  // en cuanto haya código
  const held = useRef<{ form: HTMLFormElement; submitter: HTMLElement | null } | null>(null);
  const giveUp = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const release = useCallback(() => {
    const pending = held.current;
    held.current = null;
    if (giveUp.current) clearTimeout(giveUp.current);
    setHolding(false);
    // Un instante después: que Turnstile haya terminado de poner el código en el formulario
    if (pending?.form.isConnected) setTimeout(() => pending.form.requestSubmit(pending.submitter), 0);
  }, []);

  // Pinta Turnstile y escucha cuándo hay código
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
          callback: () => {
            status.current = "ready";
            if (held.current) release();
          },
          "expired-callback": () => {
            status.current = "waiting";
          },
          "timeout-callback": () => {
            status.current = "waiting";
          },
          "error-callback": () => {
            status.current = "failed";
            if (held.current) release();
          },
        });
      })
      // Si no carga (sin conexión, un bloqueador…), se deja enviar: Supabase lo rechazará y se avisa allí
      .catch(() => {
        console.error("[captcha] no se pudo cargar Turnstile");
        status.current = "failed";
        if (held.current) release();
      });
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale, release]);

  // Si el formulario se envía antes de tener código, se para y se guarda para repetirlo cuando lo haya.
  // Se escucha en el propio formulario, antes de que React lo reciba: así la acción no llega a ejecutarse.
  useEffect(() => {
    if (!SITE_KEY) return;
    const form = container.current?.closest("form");
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      if (status.current !== "waiting") return;
      event.preventDefault();
      event.stopPropagation();
      held.current = { form, submitter: event.submitter };
      setHolding(true);
      if (giveUp.current) clearTimeout(giveUp.current);
      giveUp.current = setTimeout(() => {
        status.current = "failed";
        release();
      }, MAX_WAIT_MS);
    };
    form.addEventListener("submit", onSubmit);
    return () => {
      form.removeEventListener("submit", onSubmit);
      if (giveUp.current) clearTimeout(giveUp.current);
    };
  }, [release]);

  // Código nuevo después de cada envío
  useEffect(() => {
    if (resetKey === firstKey.current) return;
    status.current = "waiting";
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return (
    <>
      <div ref={container} className={styles.captcha} />
      {holding ? (
        <p className={styles.checking} role="status">
          {t("checking")}
        </p>
      ) : null}
    </>
  );
}
