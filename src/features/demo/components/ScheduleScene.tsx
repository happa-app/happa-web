"use client";
// Horarios: eliges un día y ves qué tiene cada uno y quién está en casa por la tarde.
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./Demo.module.css";

type Kind = "class" | "work" | "away";
// Cada tramo: hora de inicio, hora de fin y qué es
type Block = [number, number, Kind];

// El día se pinta de 8:00 a 22:00
const START = 8;
const END = 22;
// La hora a la que se mira quién está en casa
const CHECK = 18;

const PEOPLE: { key: "you" | "Bruno" | "Carla"; days: Block[][] }[] = [
  { key: "you", days: [[[9, 14, "class"]], [[9, 14, "class"], [17, 21, "work"]], [[10, 13, "class"]], [[9, 14, "class"]], [[16, 21, "work"]]] },
  { key: "Bruno", days: [[[8, 16, "work"]], [[8, 16, "work"]], [[8, 16, "work"]], [[8, 16, "work"]], [[8, 14, "work"]]] },
  { key: "Carla", days: [[[15, 20, "class"]], [[START, END, "away"]], [[START, END, "away"]], [[15, 20, "class"]], [[10, 13, "class"]]] },
];

const KIND_CLASS: Record<Kind, string> = { class: styles.blockClass, work: styles.blockWork, away: styles.blockAway };

export function ScheduleScene() {
  const t = useTranslations("Demo.schedule");
  const you = useTranslations("Demo")("you");
  const locale = useLocale();
  const [day, setDay] = useState(2);

  const nameOf = (key: string) => (key === "you" ? you : key);
  // En casa a las 18:00: quien no tiene ningún tramo que pille esa hora
  const home = PEOPLE.filter((person) => !person.days[day].some(([from, to]) => from <= CHECK && CHECK < to)).map((person) => nameOf(person.key));

  return (
    <>
      <div className={styles.days} role="group" aria-label={t("daysLabel")}>
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            className={index === day ? `${styles.dayButton} ${styles.dayButtonActive}` : styles.dayButton}
            aria-pressed={index === day}
            onClick={() => setDay(index)}
          >
            {t(`days.d${index + 1}`)}
          </button>
        ))}
      </div>

      <ul className={styles.people}>
        {PEOPLE.map((person) => (
          <li key={person.key} className={styles.person}>
            <span className={styles.personName}>{nameOf(person.key)}</span>
            <span className={styles.track}>
              {person.days[day].map(([from, to, kind]) => (
                <span
                  key={`${from}-${kind}`}
                  className={`${styles.block} ${KIND_CLASS[kind]}`}
                  // Dónde empieza y cuánto ocupa el tramo, en tanto por ciento del día pintado
                  style={{ left: `${((from - START) / (END - START)) * 100}%`, width: `${((to - from) / (END - START)) * 100}%` }}
                >
                  {t(`kinds.${kind}`)}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.hours} aria-hidden="true">
        <span>{t("from")}</span>
        <span>{t("to")}</span>
      </p>

      <p className={styles.status} aria-live="polite">
        {home.length > 0 ? t("atHome", { names: new Intl.ListFormat(locale, { type: "conjunction" }).format(home) }) : t("nobody")}
      </p>
    </>
  );
}
