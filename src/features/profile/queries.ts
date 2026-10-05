// Lectura del perfil propio (en el servidor). RLS deja ver y cambiar solo el tuyo.
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "./types";

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { name: profile.display_name, avatarUrl: profile.avatar_url, email };
}
