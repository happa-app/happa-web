// Ausencias que siguen en pie (de hoy en adelante): quién, qué días y la nota. Quien puede, las edita o borra.
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDay } from "../format";
import type { Absence, SchedulePerson } from "../types";
import { ScheduleActionButton } from "./ScheduleActionButton";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  people: SchedulePerson[];
  absences: Absence[];
  currentUserId: string;
};

export function AbsenceList({ householdId, people, absences, currentUserId }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("absences.title")}</h2>
      {absences.length === 0 ? (
        <p className={styles.empty}>{t("absences.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {[...absences]
            .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
            .map((a) => {
              const person = people.find((p) => p.userId === a.userId);
              const name = a.userId === currentUserId ? t("youCap") : (person?.name ?? t("someone"));
              const when =
                a.startsOn === a.endsOn
                  ? t("absences.oneDay", { date: formatDay(a.startsOn, locale) })
                  : t("absences.range", { from: formatDay(a.startsOn, locale), to: formatDay(a.endsOn, locale) });
              return (
                <li key={a.id}>
                  <div className={styles.rowMain}>
                    <p className={styles.rowTitle}>{name}</p>
                    <p className={styles.rowMeta}>
                      {when}
                      {a.note ? ` · “${a.note}”` : ""}
                    </p>
                  </div>
                  {person?.canEdit ? (
                    <div className={styles.rowActions}>
                      <Link href={`/hogar/${householdId}/horarios/ausencia/${a.id}`} className={styles.textLink}>
                        {t("absences.edit")}
                      </Link>
                      <ScheduleActionButton
                        fields={{ householdId, intent: "deleteAbsence", absenceId: a.id }}
                        label={t("absences.delete")}
                        confirmText={t("absences.deleteConfirm")}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
