"use client";
// Ruleta: la misma rueda que usa la app. Aquí el azar lo pone el navegador; en la app, la base de datos.
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { RouletteWheel, targetRotation } from "@/features/roulette";
import styles from "./Demo.module.css";

// Lo que tarda en pararse: lo mismo que la transición de la rueda (Roulette.module.css)
const SPIN_MS = 4200;

export function RouletteScene() {
  const t = useTranslations("Demo.roulette");
  const you = useTranslations("Demo")("you");
  const names = [you, "Bruno", "Carla"];
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [winner, setWinner] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function spin() {
    const index = Math.floor(Math.random() * names.length);
    // Quien tiene quitadas las animaciones en su dispositivo ve el resultado sin giro
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setWinner(index);
    setRotation((current) => targetRotation(current, index, names.length, Math.random() * 0.6 - 0.3));
    setPhase("spinning");
    timer.current = setTimeout(() => setPhase("done"), reduced ? 0 : SPIN_MS);
  }

  return (
    <div className={styles.roulette}>
      <p className={styles.question}>{t("question")}</p>
      <div className={styles.wheel}>
        <RouletteWheel names={names} rotation={rotation} spinning={phase === "spinning"} label={t("wheelLabel")} />
      </div>
      <p className={styles.result} aria-live="polite">
        {phase === "done" ? (winner === 0 ? t("resultYou") : t("result", { name: names[winner] })) : phase === "spinning" ? t("spinning") : ""}
      </p>
      <button type="button" className={styles.wideButton} onClick={spin} disabled={phase === "spinning"}>
        {phase === "done" ? t("again") : t("spin")}
      </button>
    </div>
  );
}
