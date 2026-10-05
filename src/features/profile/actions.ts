"use server";
// Cambiar tu nombre (el que ven los demás). La base de datos solo deja cambiar el tuyo.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { displayNameSchema } from "./schemas";
import { PROFILE_ERROR_KEYS, type ProfileErrorKey, type ProfileFormState } from "./types";

export async function updateDisplayName(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const value = formData.get("name");
  const parsed = displayNameSchema.safeParse(typeof value === "string" ? value : "");
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message;
    return { status: "error", error: (PROFILE_ERROR_KEYS as readonly string[]).includes(key) ? (key as ProfileErrorKey) : "generic" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { status: "error", error: "generic" };

  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", userId);
  if (error) {
    console.error("[perfil] no se pudo cambiar el nombre:", error);
    return { status: "error", error: "generic" };
  }
  // El nombre sale en la cabecera y en todas partes
  revalidatePath("/", "layout");
  return { status: "done" };
}
