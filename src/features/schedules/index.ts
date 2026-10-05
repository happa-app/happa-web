// Lo que el resto de la app puede usar de horarios. Importa desde "@/features/schedules".
// Las lecturas de la base de datos están en "@/features/schedules/server".
export { AbsenceForm } from "./components/AbsenceForm";
export { AbsenceList } from "./components/AbsenceList";
export { BlockForm } from "./components/BlockForm";
export { BlockList } from "./components/BlockList";
export { CopySchedule } from "./components/CopySchedule";
export { DayView } from "./components/DayView";
export { NowCard } from "./components/NowCard";
export { SchedulesHome } from "./components/SchedulesHome";
export { uuidSchema } from "./schemas";
export { nowIn, presenceAt } from "./time";
export type { Absence, OtherSchedule, ScheduleBlock, ScheduleOverview, SchedulePerson } from "./types";
