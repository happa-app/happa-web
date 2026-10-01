// Lecturas de hogares para las páginas (se ejecutan en el servidor).
// Las políticas RLS ya filtran: cada consulta solo devuelve lo que la persona puede ver.
import { createClient } from "@/lib/supabase/server";
import { householdIdSchema } from "./schemas";
import type { HouseholdDetail, HouseholdSummary, InvitePreview } from "./types";

// Hogares activos de la persona, con su rol y cuántos miembros tiene cada uno.
export async function getMyHouseholds(userId: string): Promise<HouseholdSummary[]> {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("household_members")
    .select("role, households(id, name, kind)")
    .eq("user_id", userId)
    .is("left_at", null)
    .order("joined_at");
  if (error) throw error;

  const rows = (memberships ?? []).flatMap((m) =>
    m.households ? [{ ...m.households, role: m.role }] : [],
  );
  if (rows.length === 0) return [];

  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("household_id, role")
    .in(
      "household_id",
      rows.map((r) => r.id),
    )
    .is("left_at", null);
  if (membersError) throw membersError;

  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    if (m.role === "landlord") continue;
    counts.set(m.household_id, (counts.get(m.household_id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    role: r.role,
    memberCount: counts.get(r.id) ?? 0,
  }));
}

// Un hogar con sus miembros actuales. null si no existe o no eres miembro.
export async function getHousehold(id: string): Promise<HouseholdDetail | null> {
  if (!householdIdSchema.safeParse(id).success) return null;
  const supabase = await createClient();

  const { data: household, error } = await supabase
    .from("households")
    .select("id, name, kind, invite_code")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!household) return null;

  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name, avatar_url)")
    .eq("household_id", id)
    .is("left_at", null)
    .order("joined_at");
  if (membersError) throw membersError;

  return {
    id: household.id,
    name: household.name,
    kind: household.kind,
    inviteCode: household.invite_code,
    members: (members ?? []).map((m) => ({
      userId: m.user_id,
      displayName: m.profiles?.display_name ?? "",
      avatarUrl: m.profiles?.avatar_url ?? null,
      role: m.role,
    })),
  };
}

// Lo que se ve de un hogar al abrir su enlace de invitación (migración 5).
export async function getInvitePreview(code: string): Promise<InvitePreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invite_preview", { p_code: code });
  if (error) throw error;

  const row = data?.[0];
  if (!row) return null;
  return {
    householdId: row.household_id,
    name: row.name,
    kind: row.kind,
    memberCount: row.member_count,
    alreadyMember: row.already_member,
  };
}
