// Acceso a la ruleta. Recibe el cliente de Supabase, así vale en el servidor (primera carga) y en el
// navegador (girar y en vivo). Quién puede qué lo decide la base de datos (migración 16).
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { HISTORY_SIZE, type RouletteSpin } from "./types";

const SPIN_FIELDS = "id, title, spun_by, chosen_id, created_at, roulette_participants(user_id)";

export type SpinRow = {
  id: string;
  title: string;
  spun_by: string | null;
  chosen_id: string | null;
  created_at: string;
  roulette_participants?: { user_id: string }[];
};

export function toSpin(row: SpinRow, participants?: string[]): RouletteSpin {
  return {
    id: row.id,
    title: row.title,
    spunBy: row.spun_by,
    chosenId: row.chosen_id,
    createdAt: row.created_at,
    participants: participants ?? (row.roulette_participants ?? []).map((p) => p.user_id),
  };
}

// Los últimos giros del hogar, del más nuevo al más antiguo
export async function fetchSpins(supabase: AppSupabaseClient, householdId: string): Promise<RouletteSpin[]> {
  const { data, error } = await supabase
    .from("roulette_spins")
    .select(SPIN_FIELDS)
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_SIZE);
  if (error) throw error;
  return ((data ?? []) as unknown as SpinRow[]).map((r) => toSpin(r));
}

// Un giro con quiénes entraban (cuando llega en vivo, solo trae el giro)
export async function fetchSpin(supabase: AppSupabaseClient, spinId: string): Promise<RouletteSpin | null> {
  const { data, error } = await supabase.from("roulette_spins").select(SPIN_FIELDS).eq("id", spinId).maybeSingle();
  if (error) throw error;
  return data ? toSpin(data as unknown as SpinRow) : null;
}

// Girar: la base de datos elige y devuelve el giro
export async function spinRoulette(
  supabase: AppSupabaseClient,
  householdId: string,
  title: string,
  participants: string[],
): Promise<{ spin: RouletteSpin | null; error: { message?: string } | null }> {
  const { data, error } = await supabase.rpc("spin_roulette", {
    p_household: householdId,
    p_title: title,
    p_participants: participants,
  });
  if (error || !data) return { spin: null, error: error ?? { message: "No spin" } };
  return { spin: toSpin(data as unknown as SpinRow, participants), error: null };
}
