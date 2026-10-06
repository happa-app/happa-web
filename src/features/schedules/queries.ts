// Lecturas de horarios para las páginas (se ejecutan en el servidor).
// RLS ya filtra: solo llegan los horarios y ausencias de los hogares en los que vives (migración 11).
import { avatarUrl } from "@/features/profile/avatar";
import { createClient } from "@/lib/supabase/server";
import { nowIn, shortTime } from "./time";
import type { Absence, OtherSchedule, ScheduleBlock, ScheduleKind, ScheduleOverview, SchedulePerson, Weekday } from "./types";

type BlockRow = {
  id: string;
  user_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  kind: ScheduleKind;
  label: string | null;
};
type AbsenceRow = { id: string; user_id: string; starts_on: string; ends_on: string; note: string | null };
type MemberRow = { user_id: string; role: string; profiles: { display_name: string; avatar_path: string | null } | null };

const RESIDENT_ROLES = ["admin", "member", "minor"] as const;

function toBlock(row: BlockRow): ScheduleBlock {
  return {
    id: row.id,
    userId: row.user_id,
    weekday: row.weekday as Weekday,
    startsAt: shortTime(row.starts_at),
    endsAt: shortTime(row.ends_at),
    kind: row.kind,
    label: row.label,
  };
}

function toAbsence(row: AbsenceRow): Absence {
  return { id: row.id, userId: row.user_id, startsOn: row.starts_on, endsOn: row.ends_on, note: row.note };
}

// Todo lo de horarios de un hogar. null si no vives en él (el casero tampoco lo ve).
export async function getScheduleOverview(householdId: string, userId: string): Promise<ScheduleOverview | null> {
  const supabase = await createClient();
  const { data: household, error } = await supabase
    .from("households")
    .select("name, timezone")
    .eq("id", householdId)
    .maybeSingle();
  if (error) throw error;
  if (!household) return null;

  const today = nowIn(household.timezone).date;
  const [members, guardianships, blocks, absences] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, role, profiles(display_name, avatar_path)")
      .eq("household_id", householdId)
      .is("left_at", null)
      .in("role", [...RESIDENT_ROLES])
      .order("joined_at"),
    supabase.from("guardianships").select("minor_id").eq("guardian_id", userId),
    supabase
      .from("schedule_blocks")
      .select("id, user_id, weekday, starts_at, ends_at, kind, label")
      .eq("household_id", householdId)
      .order("weekday")
      .order("starts_at"),
    supabase
      .from("absences")
      .select("id, user_id, starts_on, ends_on, note")
      .eq("household_id", householdId)
      .gte("ends_on", today)
      .order("starts_on"),
  ]);
  for (const r of [members, guardianships, blocks, absences]) if (r.error) throw r.error;

  const memberRows = (members.data ?? []) as unknown as MemberRow[];
  // Solo quien vive aquí ve los horarios
  if (!memberRows.some((m) => m.user_id === userId)) return null;

  const guarded = new Set(((guardianships.data ?? []) as { minor_id: string }[]).map((g) => g.minor_id));
  const people: SchedulePerson[] = memberRows.map((m) => ({
    userId: m.user_id,
    name: m.profiles?.display_name ?? "",
    avatarUrl: avatarUrl(m.profiles?.avatar_path),
    role: m.role as SchedulePerson["role"],
    canEdit: m.user_id === userId || (m.role === "minor" && guarded.has(m.user_id)),
  }));

  return {
    householdName: household.name,
    timezone: household.timezone,
    people,
    blocks: ((blocks.data ?? []) as BlockRow[]).map(toBlock),
    absences: ((absences.data ?? []) as AbsenceRow[]).map(toAbsence),
  };
}

// Otros hogares en los que vives y tienes horario apuntado (para copiarlo a este)
export async function getOtherSchedules(householdId: string, userId: string): Promise<OtherSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("household_id, households(name)")
    .eq("user_id", userId)
    .neq("household_id", householdId);
  if (error) throw error;

  const byHousehold = new Map<string, OtherSchedule>();
  for (const row of (data ?? []) as unknown as { household_id: string; households: { name: string } | null }[]) {
    const current = byHousehold.get(row.household_id);
    if (current) current.blockCount += 1;
    else byHousehold.set(row.household_id, { householdId: row.household_id, name: row.households?.name ?? "", blockCount: 1 });
  }
  return [...byHousehold.values()].sort((a, b) => a.name.localeCompare(b.name));
}
