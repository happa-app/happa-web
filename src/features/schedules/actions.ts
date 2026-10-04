"use server";
// Acciones de horarios y ausencias. Llaman a funciones de la base de datos (migración 11), que son las
// que comprueban permisos y solapes: aquí solo se validan los datos del formulario.
import { parseLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { toScheduleErrorKey } from "./errors";
import { buildAbsence, buildBlock, uuidSchema } from "./schemas";
import { nowIn } from "./time";
import type { AbsenceFormState, BlockFormState, ScheduleActionState } from "./types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function id(formData: FormData, key: string): string | null {
  const parsed = uuidSchema.safeParse(text(formData, key));
  return parsed.success ? parsed.data : null;
}

// Página del horario de una persona: el tuyo, o el de tu menor (?persona=...)
function editorHref(householdId: string, personId: string | null, me: string | undefined) {
  const base = `/hogar/${householdId}/horarios/editar`;
  return personId && personId !== me ? `${base}?persona=${personId}` : base;
}

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, me: data?.claims.sub };
}

// Añadir una franja a uno o varios días, o cambiar una (si llega blockId; entonces, un solo día)
export async function saveBlock(_prev: BlockFormState, formData: FormData): Promise<BlockFormState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const personId = id(formData, "personId");
  const blockId = text(formData, "blockId") ? id(formData, "blockId") : null;
  if (!householdId || !personId || (text(formData, "blockId") && !blockId)) return { status: "error", formError: "generic" };

  const built = buildBlock({
    days: formData.getAll("days").filter((d): d is string => typeof d === "string"),
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt"),
    kind: text(formData, "kind"),
    label: text(formData, "label"),
  });
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };
  const v = built.value;
  if (blockId && v.weekdays.length !== 1) return { status: "error", fieldErrors: { days: "daysRequired" } };

  const { supabase, me } = await currentUserId();
  const { error } = blockId
    ? await supabase.rpc("update_schedule_block", {
        p_block: blockId,
        p_weekday: v.weekdays[0],
        p_starts_at: v.startsAt,
        p_ends_at: v.endsAt,
        p_kind: v.kind,
        p_label: v.label ?? undefined,
      })
    : await supabase.rpc("add_schedule_blocks", {
        p_household: householdId,
        p_weekdays: v.weekdays,
        p_starts_at: v.startsAt,
        p_ends_at: v.endsAt,
        p_kind: v.kind,
        p_label: v.label ?? undefined,
        p_user: personId,
      });
  if (error) {
    const key = toScheduleErrorKey(error);
    if (key === "overlap" || key === "endBeforeStart") return { status: "error", fieldErrors: { endsAt: key } };
    if (key === "labelTooLong") return { status: "error", fieldErrors: { label: key } };
    if (key === "daysRequired") return { status: "error", fieldErrors: { days: key } };
    return { status: "error", formError: key };
  }
  return redirect({ href: editorHref(householdId, personId, me), locale });
}

// Borrar una franja, o copiar aquí tu horario de otro hogar
export async function scheduleAction(_prev: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const personId = id(formData, "personId");
  const intent = text(formData, "intent");
  if (!householdId) return { status: "error", error: "generic" };

  const { supabase, me } = await currentUserId();
  let result: { error: { message?: string; code?: string } | null };
  if (intent === "deleteBlock") {
    const blockId = id(formData, "blockId");
    if (!blockId) return { status: "error", error: "generic" };
    result = await supabase.rpc("delete_schedule_block", { p_block: blockId });
  } else if (intent === "copy") {
    const fromId = id(formData, "fromHouseholdId");
    if (!fromId) return { status: "error", error: "generic" };
    result = await supabase.rpc("copy_schedule", { p_from: fromId, p_to: householdId });
  } else if (intent === "deleteAbsence") {
    const absenceId = id(formData, "absenceId");
    if (!absenceId) return { status: "error", error: "generic" };
    result = await supabase.rpc("delete_absence", { p_absence: absenceId });
  } else {
    return { status: "error", error: "generic" };
  }
  if (result.error) return { status: "error", error: toScheduleErrorKey(result.error) };

  const href = intent === "deleteAbsence" ? `/hogar/${householdId}/horarios` : editorHref(householdId, personId, me);
  return redirect({ href, locale });
}

// Crear o cambiar una ausencia (si llega absenceId, se cambia)
export async function saveAbsence(_prev: AbsenceFormState, formData: FormData): Promise<AbsenceFormState> {
  const locale = parseLocale(formData.get("locale"));
  const householdId = id(formData, "householdId");
  const personId = id(formData, "personId");
  const absenceId = text(formData, "absenceId") ? id(formData, "absenceId") : null;
  if (!householdId || !personId || (text(formData, "absenceId") && !absenceId)) return { status: "error", formError: "generic" };

  // Hoy en la zona horaria del hogar (la manda la página); la base de datos lo vuelve a comprobar
  const timezone = text(formData, "timezone");
  let today: string;
  try {
    today = nowIn(timezone || "Europe/Madrid").date;
  } catch {
    today = nowIn("Europe/Madrid").date;
  }
  const built = buildAbsence(
    { startsOn: text(formData, "startsOn"), endsOn: text(formData, "endsOn"), note: text(formData, "note") },
    today,
  );
  if (!built.ok) return { status: "error", fieldErrors: built.fieldErrors, formError: built.formError };
  const v = built.value;

  const { supabase } = await currentUserId();
  const { error } = await supabase.rpc("save_absence", {
    p_household: householdId,
    p_starts_on: v.startsOn,
    p_ends_on: v.endsOn,
    p_note: v.note ?? undefined,
    p_absence: absenceId ?? undefined,
    p_user: personId,
  });
  if (error) {
    const key = toScheduleErrorKey(error);
    if (key === "absenceOverlap" || key === "absencePast" || key === "absenceTooLong" || key === "endBeforeStart") {
      return { status: "error", fieldErrors: { endsOn: key === "endBeforeStart" ? "absenceEndBeforeStart" : key } };
    }
    if (key === "noteTooLong") return { status: "error", fieldErrors: { note: key } };
    return { status: "error", formError: key };
  }
  return redirect({ href: `/hogar/${householdId}/horarios`, locale });
}
