"use server";
// Acciones de tareas. Llaman a funciones de la base de datos (migración 12), que son las que comprueban
// permisos (quién puede crear, marcar, dar el visto bueno...): aquí solo se validan los datos del formulario.
import { revalidatePath } from "next/cache";
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { schedulePushDispatch } from "@/lib/push/schedule";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "./dates";
import { toChoreErrorKey } from "./errors";
import { buildChore, uuidSchema } from "./schemas";
import type { ChoreActionState, ChoreFormState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function id(formData: FormData, key: string): string | null {
  const parsed = uuidSchema.safeParse(text(formData, key));
  return parsed.success ? parsed.data : null;
}

function strings(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}

// Hoy en la zona horaria del hogar (la manda la página); la base de datos lo vuelve a comprobar
function householdToday(timezone: string) {
  try {
    return todayIn(timezone || "Europe/Madrid");
  } catch {
    return todayIn("Europe/Madrid");
  }
}

// Crear una tarea, o cambiarla (si llega choreId)
export async function saveChore(_prev: ChoreFormState, formData: FormData): Promise<ChoreFormState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const choreId = text(formData, "choreId") ? id(formData, "choreId") : null;
  if (!householdId || (text(formData, "choreId") && !choreId)) return { status: "error", formError: "generic" };

  const built = buildChore(
    {
      title: text(formData, "title"),
      notes: text(formData, "notes"),
      effort: text(formData, "effort"),
      frequency: text(formData, "frequency"),
      interval: text(formData, "interval") || "1",
      days: strings(formData, "days"),
      startsOn: text(formData, "startsOn"),
      assignment: text(formData, "assignment"),
      people: strings(formData, "people"),
      requiresApproval: text(formData, "requiresApproval") === "on",
    },
    householdToday(text(formData, "timezone")),
    choreId ? text(formData, "keepStart") || undefined : undefined,
  );
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };
  const v = built.value;

  const supabase = await createClient();
  const fields = {
    p_title: v.title,
    p_effort: v.effort,
    p_frequency: v.frequency,
    p_interval: v.interval,
    p_weekdays: v.weekdays,
    p_starts_on: v.startsOn,
    p_assignment: v.assignment,
    p_people: v.people,
    p_requires_approval: v.requiresApproval,
    p_notes: v.notes ?? undefined,
  };
  const { error } = choreId
    ? await supabase.rpc("update_chore", { p_chore: choreId, ...fields })
    : await supabase.rpc("create_chore", { p_household: householdId, ...fields });
  if (error) {
    const key = toChoreErrorKey(error);
    if (key === "titleRequired" || key === "titleTooLong") return { status: "error", fieldErrors: { title: key } };
    if (key === "notesTooLong") return { status: "error", fieldErrors: { notes: key } };
    if (key === "daysRequired") return { status: "error", fieldErrors: { days: key } };
    if (key === "startInvalid") return { status: "error", fieldErrors: { startsOn: key } };
    if (key === "personRequired" || key === "rotationRequired" || key === "personGone") {
      return { status: "error", fieldErrors: { people: key } };
    }
    return { status: "error", formError: key };
  }
  return redirect({ href: `/hogar/${householdId}/tareas/todas`, locale });
}

// Lo que se hace con un día (hecha, no está hecha, visto bueno, me la quedo, cambiar de persona)
// o con una tarea (borrarla).
export async function choreAction(_prev: ChoreActionState, formData: FormData): Promise<ChoreActionState> {
  // Los avisos que cree esta acción salen al móvil al terminar
  schedulePushDispatch();
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const intent = text(formData, "intent");
  if (!householdId) return { status: "error", error: "generic" };
  const supabase = await createClient();

  if (intent === "deleteChore") {
    const choreId = id(formData, "choreId");
    if (!choreId) return { status: "error", error: "generic" };
    const { error } = await supabase.rpc("delete_chore", { p_chore: choreId });
    if (error) return { status: "error", error: toChoreErrorKey(error) };
    return redirect({ href: `/hogar/${householdId}/tareas/todas`, locale });
  }

  const dayId = id(formData, "dayId");
  if (!dayId) return { status: "error", error: "generic" };
  let result: { error: { message?: string; code?: string } | null };
  if (intent === "complete") result = await supabase.rpc("complete_chore", { p_occurrence: dayId });
  else if (intent === "reopen") result = await supabase.rpc("reopen_chore", { p_occurrence: dayId });
  else if (intent === "approve") result = await supabase.rpc("approve_chore", { p_occurrence: dayId });
  else if (intent === "take") result = await supabase.rpc("take_chore", { p_occurrence: dayId });
  else if (intent === "reassign") {
    // Vacío = libre
    const raw = text(formData, "userId");
    const userId = raw ? id(formData, "userId") : null;
    if (raw && !userId) return { status: "error", error: "generic" };
    result = await supabase.rpc("reassign_chore", { p_occurrence: dayId, p_user: userId ?? undefined });
  } else {
    return { status: "error", error: "generic" };
  }
  if (result.error) return { status: "error", error: toChoreErrorKey(result.error) };

  // Se vuelve a pintar la página en la que estás, sin moverte de sitio
  revalidatePath("/", "layout");
  return { status: "done" };
}
