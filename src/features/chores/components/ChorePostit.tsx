// El post-it con tu tarea (la primera pendiente, la atrasada antes) y su botón de "hecha".
// Sin tarea ("note" a null): "Hoy te libras.". Lo usan Inicio y la página de Tareas.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Chore, ChoreDay } from "../types";
import { ChoreActionButton } from "./ChoreActionButton";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  note: ChoreDay | null;
  chore: Chore | null;
  isOverdue: boolean;
  // Ruta de tareas del hogar: /hogar/<id>/tareas
  base: string;
};

export function ChorePostit({ householdId, note, chore, isOverdue, base }: Props) {
  const t = useTranslations("Chores");

  if (!note || !chore) {
    return (
      <div className={styles.postit}>
        <p className={styles.postitTitle}>{t("home.todayEmpty")}</p>
      </div>
    );
  }

  return (
    <div className={styles.postit}>
      <div className={styles.postitText}>
        <p className={styles.postitLabel}>{isOverdue ? t("row.overdue") : t("home.today")}</p>
        <Link href={`${base}/dia/${note.id}`} className={styles.postitTitle}>
          {chore.title}
        </Link>
      </div>
      <ChoreActionButton
        look="check"
        fields={{ householdId, dayId: note.id, intent: "complete" }}
        label={t("row.complete", { title: chore.title })}
      />
    </div>
  );
}
