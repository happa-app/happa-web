// Frases para explicar cada cuánto toca una tarea ("Cada 2 semanas: lunes y jueves").
// Devuelven la clave del mensaje (messages/*.json → Chores) y sus valores; el componente la traduce.
import type { ChoreRepeat } from "./dates";
import { formatDay, weekdayList } from "./format";

export type Phrase = { key: string; values: Record<string, string | number> };

export function schedulePhrase(repeat: ChoreRepeat, locale: string): Phrase {
  const interval = repeat.interval;
  switch (repeat.frequency) {
    case "once":
      return { key: "schedule.once", values: { date: formatDay(repeat.startsOn, locale) } };
    case "daily":
      return { key: "schedule.daily", values: { interval } };
    case "weekly":
      if (repeat.weekdays.length === 7 && interval === 1) return { key: "schedule.everyDay", values: {} };
      return { key: "schedule.weekly", values: { interval, days: weekdayList(repeat.weekdays, locale) } };
    case "monthly": {
      const day = Number(repeat.startsOn.slice(8, 10));
      return { key: day > 28 ? "schedule.monthlyLate" : "schedule.monthly", values: { interval, day } };
    }
  }
}
