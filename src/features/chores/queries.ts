// Lecturas de tareas para las páginas (se ejecutan en el servidor).
// RLS ya filtra: solo llegan las tareas de los hogares en los que vives (migración 12).
// Antes de leer se crean los días que falten (sync_chores): así no hace falta ningún proceso aparte.
import { createClient } from "@/lib/supabase/server";
import { addDays, todayIn } from "./dates";
import { summarize } from "./logic";
import type {
  Chore,
  ChoreAssignment,
  ChoreDay,
  ChoreEffort,
  ChoreFrequency,
  ChorePerson,
  ChoresOverview,
  ChoresSummary,
  ChoreStatus,
  Weekday,
} from "./types";

type ChoreRow = {
  id: string;
  title: string;
  notes: string | null;
  effort: number;
  frequency: ChoreFrequency;
  interval_count: number;
  weekdays: number[] | null;
  starts_on: string;
  assignment: ChoreAssignment;
  assignee_id: string | null;
  requires_approval: boolean;
  chore_rotation: { user_id: string; position: number; owed: boolean }[] | null;
};
type DayRow = {
  id: string;
  chore_id: string;
  due_on: string;
  assignee_id: string | null;
  status: ChoreStatus;
  done_by: string | null;
  done_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
  manual: boolean;
};
type MemberRow = { user_id: string; role: string; profiles: { display_name: string } | null };

const RESIDENT_ROLES = ["admin", "member", "minor"] as const;
const CHORE_FIELDS =
  "id, title, notes, effort, frequency, interval_count, weekdays, starts_on, assignment, assignee_id, requires_approval, chore_rotation(user_id, position, owed)";
const DAY_FIELDS =
  "id, chore_id, due_on, assignee_id, status, done_by, done_at, approved_by, approved_at, reopened_by, reopened_at, manual";
// Días que se leen: la última semana y las dos que vienen (más lo pendiente de antes)
const PAST_DAYS = 7;
const AHEAD_DAYS = 13;

function toChore(row: ChoreRow): Chore {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    effort: row.effort as ChoreEffort,
    frequency: row.frequency,
    interval: row.interval_count,
    weekdays: (row.weekdays ?? []) as Weekday[],
    startsOn: row.starts_on,
    assignment: row.assignment,
    assigneeId: row.assignee_id,
    rotation: [...(row.chore_rotation ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((r) => ({ userId: r.user_id, owed: r.owed })),
    requiresApproval: row.requires_approval,
  };
}

function toDay(row: DayRow): ChoreDay {
  return {
    id: row.id,
    choreId: row.chore_id,
    dueOn: row.due_on,
    assigneeId: row.assignee_id,
    status: row.status,
    doneBy: row.done_by,
    doneAt: row.done_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    reopenedBy: row.reopened_by,
    reopenedAt: row.reopened_at,
    manual: row.manual,
  };
}

// Crea los días de las próximas dos semanas que falten. Si falla, la página se enseña igual (con lo que
// ya hubiera): el error solo queda en el registro.
async function syncChores(supabase: Awaited<ReturnType<typeof createClient>>, householdId: string) {
  const { error } = await supabase.rpc("sync_chores", { p_household: householdId });
  if (error) console.error("[tareas] no se pudieron crear los días que faltan:", error);
}

// Todo lo de tareas de un hogar. null si no vives en él (el casero tampoco lo ve).
export async function getChoresOverview(householdId: string, userId: string): Promise<ChoresOverview | null> {
  const supabase = await createClient();
  const [household, members] = await Promise.all([
    supabase.from("households").select("name, timezone").eq("id", householdId).maybeSingle(),
    supabase
      .from("household_members")
      .select("user_id, role, profiles(display_name)")
      .eq("household_id", householdId)
      .is("left_at", null)
      .in("role", [...RESIDENT_ROLES])
      .order("joined_at"),
  ]);
  if (household.error) throw household.error;
  if (members.error) throw members.error;
  if (!household.data) return null;

  const memberRows = (members.data ?? []) as unknown as MemberRow[];
  const me = memberRows.find((m) => m.user_id === userId);
  // Solo quien vive aquí ve las tareas
  if (!me) return null;

  await syncChores(supabase, householdId);
  const today = todayIn(household.data.timezone);
  const from = addDays(today, -PAST_DAYS);
  const [chores, older, recent] = await Promise.all([
    supabase.from("chores").select(CHORE_FIELDS).eq("household_id", householdId).eq("active", true).order("created_at"),
    // Lo de antes que sigue sin hacer (atrasado o esperando el visto bueno)
    supabase
      .from("chore_occurrences")
      .select(DAY_FIELDS)
      .eq("household_id", householdId)
      .lt("due_on", from)
      .neq("status", "done")
      .order("due_on")
      .limit(200),
    supabase
      .from("chore_occurrences")
      .select(DAY_FIELDS)
      .eq("household_id", householdId)
      .gte("due_on", from)
      .lte("due_on", addDays(today, AHEAD_DAYS))
      .order("due_on")
      .limit(1000),
  ]);
  for (const r of [chores, older, recent]) if (r.error) throw r.error;

  const choreList = ((chores.data ?? []) as unknown as ChoreRow[]).map(toChore);
  // Los días de tareas borradas no se enseñan (lo hecho se queda en la base de datos como historial)
  const active = new Set(choreList.map((c) => c.id));
  const days = [...((older.data ?? []) as DayRow[]), ...((recent.data ?? []) as DayRow[])]
    .map(toDay)
    .filter((d) => active.has(d.choreId));

  const people: ChorePerson[] = memberRows.map((m) => ({
    userId: m.user_id,
    name: m.profiles?.display_name ?? "",
    role: m.role as ChorePerson["role"],
  }));

  return {
    householdName: household.data.name,
    timezone: household.data.timezone,
    today,
    people,
    isAdult: me.role === "admin" || me.role === "member",
    chores: choreList,
    days,
  };
}

// Para la tarjeta de la página del hogar: cuántas te tocan hoy, atrasadas y por dar el visto bueno.
// Solo para quien vive en el hogar (la página ya lo comprueba).
export async function getChoresSummary(householdId: string, userId: string, isAdult: boolean): Promise<ChoresSummary> {
  const supabase = await createClient();
  const { data: household, error } = await supabase.from("households").select("timezone").eq("id", householdId).maybeSingle();
  if (error) throw error;
  if (!household) return { choreCount: 0, myToday: 0, myOverdue: 0, toApprove: 0 };

  await syncChores(supabase, householdId);
  const today = todayIn(household.timezone);
  const [chores, days] = await Promise.all([
    supabase.from("chores").select("id").eq("household_id", householdId).eq("active", true),
    supabase
      .from("chore_occurrences")
      .select("chore_id, due_on, status, assignee_id")
      .eq("household_id", householdId)
      .lte("due_on", today)
      .neq("status", "done")
      .limit(500),
  ]);
  for (const r of [chores, days]) if (r.error) throw r.error;

  const active = new Set(((chores.data ?? []) as { id: string }[]).map((c) => c.id));
  const rows = ((days.data ?? []) as { chore_id: string; due_on: string; status: ChoreStatus; assignee_id: string | null }[])
    .filter((d) => active.has(d.chore_id))
    .map((d) => ({ dueOn: d.due_on, status: d.status, assigneeId: d.assignee_id }));
  return summarize(rows, userId, today, isAdult, active.size);
}
