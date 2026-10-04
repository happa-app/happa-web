// Reparto de esta semana: cuánto esfuerzo le toca a cada uno (ligera = 1 punto, normal = 2, pesada = 3).
import { useTranslations } from "next-intl";
import type { ShareRow } from "../logic";
import styles from "./Chores.module.css";

type Props = { rows: ShareRow[]; me: string };

export function WeekShare({ rows, me }: Props) {
  const t = useTranslations("Chores");
  const max = Math.max(1, ...rows.map((r) => r.points));
  if (rows.every((r) => r.count === 0)) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("share.title")}</h2>
      <div className={styles.card}>
        <ul className={styles.share}>
          {rows.map((r) => (
            <li key={r.person.userId} className={styles.shareRow}>
              <span className={styles.shareName}>{r.person.userId === me ? t("youCap") : r.person.name}</span>
              <span className={styles.shareBar} aria-hidden="true">
                <span className={styles.shareFill} style={{ width: `${(r.points / max) * 100}%` }} />
              </span>
              <p className={styles.shareNumbers}>
                {t("share.numbers", { count: r.count, points: r.points, done: r.done })}
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>{t("share.hint")}</p>
      </div>
    </section>
  );
}
