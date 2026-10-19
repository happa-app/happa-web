"use client";
// "Instálala en tu móvil" (portada). Lo que enseña depende del dispositivo:
//   · Android, o Chrome/Edge en el ordenador: un botón que abre el diálogo de instalar del propio navegador.
//   · iPhone/iPad: los pasos de Safari (Apple no deja poner un botón de instalar).
//   · Otros navegadores: cómo hacerlo desde el menú.
//   · Ya abierta como app instalada: nada (la portada también se ve ahí si no hay sesión).
// Para saber todo eso hay que preguntar al navegador, que en el servidor no existe: hasta que se sabe,
// no se pinta nada (así en la app instalada no aparece para luego desaparecer).
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ShareIcon } from "@/components/brand/Icons";
import { isIos, isStandalone } from "@/lib/pwa/device";
import styles from "./InstallGuide.module.css";

// El evento que lanza Chrome cuando la web se puede instalar. No está en los tipos de TypeScript porque
// no es un estándar (Safari y Firefox no lo tienen).
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "unknown" | "standalone" | "ios" | "other";

// Si se instala con la página abierta, el modo de pantalla cambia: hay que volver a mirar
function subscribe(onChange: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getPlatform(): Platform {
  if (isStandalone()) return "standalone";
  return isIos() ? "ios" : "other";
}

function getServerPlatform(): Platform {
  return "unknown";
}

export function InstallGuide() {
  const t = useTranslations("Landing.install");
  const platform = useSyncExternalStore(subscribe, getPlatform, getServerPlatform);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Chrome avisa de que se puede instalar. preventDefault evita su aviso propio: lo ofrece nuestro botón.
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (platform === "unknown" || platform === "standalone") return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    // El evento solo sirve una vez: si dice que no, Chrome lo volverá a lanzar más adelante
    await prompt.userChoice;
    setPrompt(null);
  }

  return (
    <section className={styles.install} aria-labelledby="install-title">
      <h2 id="install-title" className={styles.title}>
        {t("title")}
      </h2>
      <p className={styles.intro}>{t("intro")}</p>

      {installed ? (
        <p className={styles.done} role="status">
          {t("installed")}
        </p>
      ) : platform === "ios" ? (
        // Cada frase va en un <span>: el <li> es flex y, sin él, el texto partido por el icono
        // se repartiría en columnas
        <ol className={styles.steps}>
          <li>
            <span>
              {t.rich("ios.share", {
                icon: () => (
                  <span className={styles.shareIcon}>
                    <ShareIcon size={18} />
                  </span>
                ),
              })}
            </span>
          </li>
          <li>
            <span>{t("ios.add")}</span>
          </li>
          <li>
            <span>{t("ios.confirm")}</span>
          </li>
        </ol>
      ) : prompt ? (
        <button type="button" className={styles.button} onClick={install}>
          {t("button")}
        </button>
      ) : (
        <p className={styles.other}>{t("other")}</p>
      )}
    </section>
  );
}
