// Esfuerzo de una tarea con tres puntos (1 ligera, 2 normal, 3 pesada)
import { useTranslations } from "next-intl";
import type { ChoreEffort } from "../types";
import styles from "./Chores.module.css";

export function EffortDots({ effort }: { effort: ChoreEffort }) {
  const t = useTranslations("Chores");
  const label = t("effortLabel", { effort: t(`efforts.${effort}`) });
  return (
    <span className={styles.effort} role="img" aria-label={label} title={label}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= effort ? styles.effortDotOn : styles.effortDot} />
      ))}
    </span>
  );
}
