"use client";
// Tareas: marcar la tuya, y ver cómo rotan los turnos y qué pasa con quien está fuera.
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./Demo.module.css";

// Turnos de fregar de lunes a viernes; hoy es el tercero
const ROTATION = ["Bruno", "Carla", "you", "Bruno", "Carla"] as const;
const TODAY = 2;

export function ChoresScene() {
  const t = useTranslations("Demo.chores");
  const you = useTranslations("Demo")("you");
  const [done, setDone] = useState(false);

  return (
    <>
      <h3 className={styles.subtitle}>{t("today")}</h3>
      <ul className={styles.list}>
        <li>
          <label className={done ? `${styles.row} ${styles.rowDone}` : styles.row}>
            <input type="checkbox" className={styles.check} checked={done} onChange={() => setDone(!done)} />
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{t("dishes")}</span>
              <span className={styles.rowMeta}>
                {done ? t("dishesDone") : t("dishesWho")}
              </span>
            </span>
          </label>
        </li>
        <li className={`${styles.row} ${styles.rowDone}`}>
          <input type="checkbox" className={styles.check} checked readOnly disabled aria-label={t("trash")} />
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{t("trash")}</span>
            <span className={styles.rowMeta}>{t("trashWho")}</span>
          </span>
        </li>
        <li className={`${styles.row} ${styles.rowAway}`}>
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{t("bathroom")}</span>
            <span className={styles.rowMeta}>{t("bathroomWho")}</span>
          </span>
        </li>
      </ul>

      <h3 className={styles.subtitle}>{t("rotation")}</h3>
      <ol className={styles.week}>
        {ROTATION.map((who, index) => (
          <li key={index} className={index === TODAY ? `${styles.day} ${styles.dayToday}` : styles.day}>
            <span className={styles.dayName}>{t(`days.d${index + 1}`)}</span>
            <span className={styles.dayWho}>{who === "you" ? you : who}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
