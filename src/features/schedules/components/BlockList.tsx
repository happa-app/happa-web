// El horario de una persona, por días: cada franja con su hora, qué es, y editar o borrar.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatTime } from "../format";
import { blocksOf } from "../time";
import { WEEKDAYS, type ScheduleBlock } from "../types";
import { ScheduleActionButton } from "./ScheduleActionButton";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  personId: string;
  // Solo las franjas de esa persona
  blocks: ScheduleBlock[];
};

export function BlockList({ householdId, personId, blocks }: Props) {
  const t = useTranslations("Schedules");
  const days = WEEKDAYS.filter((d) => blocks.some((b) => b.weekday === d));

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("editor.list")}</h2>
      {days.length === 0 ? (
        <p className={styles.empty}>{t("editor.empty")}</p>
      ) : (
        days.map((d) => (
          <div key={d} className={styles.section}>
            <h3 className={styles.dayHeading}>{t(`weekdays.${d}`)}</h3>
            <ul className={styles.list}>
              {blocksOf(personId, blocks, d).map((b) => {
                const what = b.label ? `${t(`kinds.${b.kind}`)} · ${b.label}` : t(`kinds.${b.kind}`);
                const hours = `${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`;
                return (
                  <li key={b.id}>
                    <span className={`${styles.swatch} ${styles[`kind_${b.kind}`]}`} aria-hidden="true" />
                    <div className={styles.rowMain}>
                      <p className={styles.rowTitle}>{hours}</p>
                      <p className={styles.rowMeta}>{what}</p>
                    </div>
                    <div className={styles.rowActions}>
                      <Link href={`/hogar/${householdId}/horarios/franja/${b.id}`} className={styles.textLink}>
                        {t("editor.edit")}
                      </Link>
                      <ScheduleActionButton
                        fields={{ householdId, personId, intent: "deleteBlock", blockId: b.id }}
                        label={t("editor.delete")}
                        confirmText={t("editor.deleteConfirm", { what, hours, day: t(`weekdays.${d}`) })}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
