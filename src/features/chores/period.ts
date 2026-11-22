// Plazos de las tareas (migración 31): una vez que toca puede ser un día suelto (dueOn = dueBy) o un plazo
// de varios días (cualquier día de la semana o del mes). Sin imports de otros archivos para poder probarlo
// con el test runner de Node.
import type { ChoreDay, ChoreFrequency } from "./types";

// Atrasada: pendiente y su fecha límite ya pasó (sigue siendo de quien le tocaba)
export function isOverdue(day: ChoreDay, today: string): boolean {
  return day.status === "pending" && day.dueBy < today;
}

// ¿Es un plazo de varios días?
export function isPeriod(day: ChoreDay): boolean {
  return day.dueBy > day.dueOn;
}

// Un plazo que está en curso hoy
export function isOpenPeriod(day: ChoreDay, today: string): boolean {
  return isPeriod(day) && day.dueOn <= today && today <= day.dueBy;
}

// "Cualquier día" solo vale en las tareas semanales y mensuales (lo mismo que la base de datos)
export function allowsAnytime(frequency: ChoreFrequency): boolean {
  return frequency === "weekly" || frequency === "monthly";
}
