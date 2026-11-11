"use client";
// El recorrido de la portada. Media pantalla es un "escenario" con la app y la otra media, el texto.
//   · En el ordenador el escenario se queda fijo y el texto pasa por delante: al llegar a cada capítulo
//     (Compra, Gastos...) el escenario cambia a su pantalla.
//   · En el móvil no caben las dos mitades: los capítulos son pestañas y la pantalla va debajo.
// Las seis pantallas están siempre montadas y solo se enseña la activa (atributo hidden): así, lo que has
// tocado en una sigue igual al volver. "children" es lo que va encima de los capítulos (logo y titular):
// lo pinta el servidor y este componente solo lo coloca.
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ChatScene } from "./ChatScene";
import { ChoresScene } from "./ChoresScene";
import { ExpensesScene } from "./ExpensesScene";
import { RouletteScene } from "./RouletteScene";
import { ScheduleScene } from "./ScheduleScene";
import { ShoppingScene } from "./ShoppingScene";
import styles from "./Demo.module.css";

// Cada capítulo tiene un color (los de las secciones de la app): tiñe el fondo del escenario
const TABS = [
  { key: "shopping", color: "var(--color-schedule-class)", Scene: ShoppingScene },
  { key: "expenses", color: "var(--color-owed)", Scene: ExpensesScene },
  { key: "chores", color: "var(--color-schedule-work)", Scene: ChoresScene },
  { key: "schedules", color: "var(--color-schedule-away)", Scene: ScheduleScene },
  { key: "roulette", color: "var(--color-owe)", Scene: RouletteScene },
  { key: "chat", color: "var(--color-review-border)", Scene: ChatScene },
] as const satisfies readonly { key: string; color: string; Scene: ComponentType }[];

type TabKey = (typeof TABS)[number]["key"];

// A partir de este ancho hay dos mitades (el mismo número que en Demo.module.css)
const WIDE = "(min-width: 900px)";

export function Tour({ children }: { children: ReactNode }) {
  const t = useTranslations("Demo");
  const [active, setActive] = useState<TabKey>("shopping");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // En el ordenador manda el scroll: un IntersectionObserver avisa cuando un capítulo cruza la mitad de la
  // pantalla (rootMargin deja la zona de observación en una línea a media altura) y ese pasa a ser el activo.
  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    let observer: IntersectionObserver | null = null;

    function setup() {
      observer?.disconnect();
      observer = null;
      if (!wide.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.key as TabKey);
          }
        },
        { rootMargin: "-50% 0px -50% 0px" },
      );
      for (const element of tabRefs.current) if (element) observer.observe(element);
    }

    setup();
    wide.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      wide.removeEventListener("change", setup);
    };
  }, []);

  function select(index: number) {
    setActive(TABS[index].key);
    // En el ordenador, además, se lleva el capítulo al centro (si no, el scroll volvería a cambiarlo)
    if (window.matchMedia(WIDE).matches) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      tabRefs.current[index]?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    }
  }

  // Con el teclado, las pestañas se recorren con las flechas (es lo que espera un lector de pantalla)
  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + TABS.length) % TABS.length;
    select(next);
    tabRefs.current[next]?.focus({ preventScroll: true });
  }

  const activeColor = TABS.find((tab) => tab.key === active)?.color;

  return (
    // El color del capítulo activo baja al CSS como variable (--note)
    <div className={styles.split} style={{ "--note": activeColor } as CSSProperties}>
      <div className={styles.reading}>
        {children}

        <section id="demo" className={styles.demo} aria-labelledby="demo-title">
          <header className={styles.heading}>
            <h2 id="demo-title" className={styles.title}>
              {t("title")}
            </h2>
            <p className={styles.intro}>{t("intro")}</p>
          </header>

          <div className={styles.chapters} role="tablist" aria-label={t("tabsLabel")}>
            {TABS.map(({ key }, index) => (
              <button
                key={key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`demo-tab-${key}`}
                data-key={key}
                aria-selected={key === active}
                aria-controls={`demo-panel-${key}`}
                tabIndex={key === active ? 0 : -1}
                className={key === active ? `${styles.chapter} ${styles.chapterActive}` : styles.chapter}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className={styles.chapterTitle}>{t(`tabs.${key}`)}</span>
                <span className={styles.chapterText}>{t(`about.${key}`)}</span>
              </button>
            ))}
          </div>

          {/* En el móvil, la frase del capítulo activo va aquí (dentro de la pestaña no cabe) */}
          <p className={styles.about}>{t(`about.${active}`)}</p>
        </section>
      </div>

      <div className={styles.stage}>
        {/* data-ui: esto es un trozo de la interfaz de la app, con sus propias reglas de estilo */}
        <div className={styles.device} data-ui>
          <div className={styles.deviceTop}>
            <span className={styles.household}>{t("household")}</span>
            <strong className={styles.screenTitle}>{t(`tabs.${active}`)}</strong>
          </div>
          {TABS.map(({ key, Scene }) => (
            <div
              key={key}
              role="tabpanel"
              id={`demo-panel-${key}`}
              aria-labelledby={`demo-tab-${key}`}
              hidden={key !== active}
              className={styles.screen}
            >
              <Scene />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
