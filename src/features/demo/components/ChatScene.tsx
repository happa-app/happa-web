"use client";
// Chat: una votación. Los votos son públicos y el tuyo se puede cambiar, igual que en la app.
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./Demo.module.css";

const OPTIONS = [
  { key: "pizza", voters: ["Bruno"] },
  { key: "tortilla", voters: ["Carla"] },
  { key: "sushi", voters: [] },
] as const;

type OptionKey = (typeof OPTIONS)[number]["key"];

export function ChatScene() {
  const t = useTranslations("Demo.chat");
  const you = useTranslations("Demo")("you");
  const [vote, setVote] = useState<OptionKey | null>(null);
  const total = 2 + (vote ? 1 : 0);

  return (
    <>
      <div className={styles.message}>
        <span className={styles.author}>Bruno</span>
        {t("m1")}
      </div>
      <div className={styles.card}>
        <strong className={styles.pollTitle}>{t("pollTitle")}</strong>
        <ul className={styles.options}>
          {OPTIONS.map(({ key, voters }) => {
            const names = key === vote ? [...voters, you] : [...voters];
            return (
              <li key={key}>
                <button
                  type="button"
                  className={key === vote ? `${styles.option} ${styles.optionMine}` : styles.option}
                  aria-pressed={key === vote}
                  onClick={() => setVote(key === vote ? null : key)}
                >
                  {/* La barra de fondo: su ancho es la parte de los votos que tiene esta opción */}
                  <span className={styles.bar} style={{ width: `${(names.length / total) * 100}%` }} aria-hidden="true" />
                  <span className={styles.optionText}>
                    <span>{t(`options.${key}`)}</span>
                    <span className={styles.rowMeta}>
                      {names.length > 0 ? names.join(", ") : t("noVotes")}
                    </span>
                  </span>
                  <strong className={styles.optionCount}>{names.length}</strong>
                </button>
              </li>
            );
          })}
        </ul>
        <p className={styles.rowMeta}>{t("hint")}</p>
      </div>
      {vote ? (
        <div className={`${styles.message} ${styles.messageMine}`}>{t("reply", { option: t(`options.${vote}`) })}</div>
      ) : null}
    </>
  );
}
