// Una parte de la página de tareas (atrasadas, por dar el visto bueno, hoy...): título y sus filas.
import type { Chore, ChoreDay } from "../types";
import { ChoreDayRow } from "./ChoreDayRow";
import styles from "./Chores.module.css";

type Props = {
  title: string;
  householdId: string;
  days: ChoreDay[];
  chores: Chore[];
  names: Record<string, string>;
  me: string;
  isAdult: boolean;
  today: string;
  // Si no hay nada: este texto (o, sin él, no se enseña la parte)
  emptyText?: string;
  showDate?: boolean;
};

export function ChoreDaySection({ title, householdId, days, chores, names, me, isAdult, today, emptyText, showDate }: Props) {
  const byId = new Map(chores.map((c) => [c.id, c]));
  const rows = days.flatMap((day) => {
    const chore = byId.get(day.choreId);
    return chore ? [{ day, chore }] : [];
  });
  if (rows.length === 0 && !emptyText) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {rows.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {rows.map(({ day, chore }) => (
            <ChoreDayRow
              key={day.id}
              householdId={householdId}
              day={day}
              chore={chore}
              names={names}
              me={me}
              isAdult={isAdult}
              today={today}
              showDate={showDate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
