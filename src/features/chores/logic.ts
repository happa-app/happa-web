// Qué puede hacer cada uno con un día de una tarea, y cómo se ordenan y resumen.
// Son las mismas reglas que comprueba la base de datos (migración 12): aquí solo sirven para enseñar
// los botones que tocan.
import { addDays, mondayOf } from "./dates";
import type { Chore, ChoreDay, ChorePerson, ChoresSummary } from "./types";

// Atrasada: pendiente y su día ya pasó (sigue siendo de quien le tocaba)
export function isOverdue(day: ChoreDay, today: string): boolean {
  return day.status === "pending" && day.dueOn < today;
}

// "Hecha": un adulto puede marcar cualquiera (la hizo él); un menor, solo las suyas
export function canComplete(day: ChoreDay, me: string, isAdult: boolean): boolean {
  return day.status === "pending" && (isAdult || day.assigneeId === me);
}

// "No está hecha": un adulto, cualquiera; un menor, las que marcó él o son suyas
export function canReopen(day: ChoreDay, me: string, isAdult: boolean): boolean {
  return day.status !== "pending" && (isAdult || day.doneBy === me || day.assigneeId === me);
}

// Visto bueno: solo un adulto, y solo si la marcó un menor y la tarea lo pide
export function canApprove(day: ChoreDay, isAdult: boolean): boolean {
  return isAdult && day.status === "review";
}

// "Me la quedo": cualquiera que viva aquí, si está libre y pendiente
export function canTake(day: ChoreDay): boolean {
  return day.status === "pending" && day.assigneeId === null;
}

// Cambiar a quién le toca: un adulto, si está pendiente
export function canReassign(day: ChoreDay, isAdult: boolean): boolean {
  return isAdult && day.status === "pending";
}

// Orden dentro de un día: lo tuyo primero, luego lo libre y lo de los demás; lo pendiente antes que lo hecho
export function sortDays(days: ChoreDay[], me: string, titles: Map<string, string>): ChoreDay[] {
  const rank = (d: ChoreDay) => (d.assigneeId === me ? 0 : d.assigneeId === null ? 1 : 2);
  const done = (d: ChoreDay) => (d.status === "done" ? 1 : 0);
  return [...days].sort(
    (a, b) =>
      a.dueOn.localeCompare(b.dueOn) ||
      done(a) - done(b) ||
      rank(a) - rank(b) ||
      (titles.get(a.choreId) ?? "").localeCompare(titles.get(b.choreId) ?? ""),
  );
}

// Lo que se enseña en la tarjeta del hogar
export function summarize(
  days: Pick<ChoreDay, "assigneeId" | "status" | "dueOn">[],
  me: string,
  today: string,
  isAdult: boolean,
  choreCount: number,
): ChoresSummary {
  const mine = days.filter((d) => d.assigneeId === me && d.status === "pending");
  return {
    choreCount,
    myToday: mine.filter((d) => d.dueOn === today).length,
    myOverdue: mine.filter((d) => d.dueOn < today).length,
    toApprove: isAdult ? days.filter((d) => d.status === "review").length : 0,
  };
}

export type ShareRow = { person: ChorePerson; count: number; points: number; done: number };

// Reparto de esta semana (de lunes a domingo): cuántas tareas y cuánto esfuerzo le toca a cada uno
export function weekShare(days: ChoreDay[], chores: Chore[], people: ChorePerson[], today: string): ShareRow[] {
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const effort = new Map(chores.map((c) => [c.id, c.effort as number]));
  return people.map((person) => {
    const theirs = days.filter(
      (d) => d.assigneeId === person.userId && d.dueOn >= monday && d.dueOn <= sunday && effort.has(d.choreId),
    );
    return {
      person,
      count: theirs.length,
      points: theirs.reduce((sum, d) => sum + (effort.get(d.choreId) ?? 0), 0),
      done: theirs.filter((d) => d.status === "done").length,
    };
  });
}
