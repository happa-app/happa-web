// Tus números en todos tus hogares: tareas hechas, lo que has pagado, la ruleta y el chat.
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/features/expenses/money";
import type { MyStats } from "../types";
import styles from "./Profile.module.css";

export function ProfileStats({ stats }: { stats: MyStats }) {
  const t = useTranslations("Profile.stats");
  const locale = useLocale();
  const number = (n: number) => new Intl.NumberFormat(locale).format(n);
  const items = [
    { key: "chores", value: number(stats.choresDone) },
    { key: "paid", value: formatMoney(stats.paidCents, locale) },
    { key: "roulette", value: t("times", { count: stats.rouletteChosen }) },
    { key: "messages", value: number(stats.messagesSent) },
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="profile-stats">
      <h2 id="profile-stats" className={styles.sectionTitle}>
        {t("title")}
      </h2>
      <dl className={styles.stats}>
        {items.map((item) => (
          <div key={item.key} className={styles.stat}>
            <dt className={styles.statLabel}>{t(item.key)}</dt>
            <dd className={styles.statValue}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
