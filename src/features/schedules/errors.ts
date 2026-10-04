// Traduce los errores de las funciones de la base de datos (migración 11) a claves de mensaje propias.
import type { ScheduleErrorKey } from "./types";

export function toScheduleErrorKey(error: { message?: string; code?: string }): ScheduleErrorKey {
  const message = error.message ?? "";
  // Primero las de ausencias: "Absences cannot overlap" también dice "cannot overlap"
  if (message.includes("Absences cannot overlap")) return "absenceOverlap";
  if (message.includes("Absences cannot be in the past")) return "absencePast";
  if (message.includes("Absences can be up to a year") || message.includes("absences_max_length")) return "absenceTooLong";
  if (message.includes("absences_note_length")) return "noteTooLong";
  if (message.includes("Schedule blocks cannot overlap")) return "overlap";
  if (message.includes("The end must be after the start")) return "endBeforeStart";
  if (message.includes("Choose at least one day")) return "daysRequired";
  if (message.includes("Too many schedule blocks") || message.includes("Too many absences")) return "tooMany";
  if (message.includes("schedule_blocks_label_length")) return "labelTooLong";
  if (message.includes("There is no schedule to copy")) return "nothingToCopy";
  if (message.includes("You cannot change this schedule") || message.includes("Not authenticated")) return "notAllowed";
  // Solo se ve en el servidor (terminal de npm run dev o logs de Vercel), nunca en la app.
  console.error("[horarios] error sin traducir:", error);
  return "generic";
}
