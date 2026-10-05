// Tipos del perfil
export type MyProfile = {
  name: string;
  avatarUrl: string | null;
  email: string | null;
};

export const PROFILE_ERROR_KEYS = ["nameRequired", "nameTooLong", "generic"] as const;
export type ProfileErrorKey = (typeof PROFILE_ERROR_KEYS)[number];

export type ProfileFormState = {
  status: "idle" | "done" | "error";
  error?: ProfileErrorKey;
};

export const initialProfileState: ProfileFormState = { status: "idle" };
