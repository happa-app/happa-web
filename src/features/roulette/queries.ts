// Lectura de la ruleta para la página (en el servidor). Solo para quienes viven en el hogar.
import { absenceOn, nowIn } from "@/features/schedules/time";
import { getScheduleOverview } from "@/features/schedules/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSpins } from "./api";
import type { RoulettePage } from "./types";

export async function getRoulettePage(householdId: string, userId: string): Promise<RoulettePage | null> {
  // Quién vive aquí y sus ausencias (para dejar fuera, de partida, a quien no está)
  const overview = await getScheduleOverview(householdId, userId);
  if (!overview) return null;
  const supabase = await createClient();
  const spins = await fetchSpins(supabase, householdId);
  const today = nowIn(overview.timezone).date;
  const me = overview.people.find((p) => p.userId === userId);

  return {
    householdName: overview.householdName,
    timezone: overview.timezone,
    isAdult: me?.role === "admin" || me?.role === "member",
    people: overview.people.map((p) => ({
      userId: p.userId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      role: p.role,
      awayUntil: absenceOn(p.userId, overview.absences, today)?.endsOn ?? null,
    })),
    spins,
  };
}
