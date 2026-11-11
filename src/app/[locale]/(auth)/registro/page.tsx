// Página /registro. Solo compone: el formulario y su lógica viven en features/auth.
import { SignupClosed, SignupForm } from "@/features/auth";
import { SIGNUP_CLOSED } from "@/lib/signup";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupPage({ searchParams }: Props) {
  // Modo demo: el registro está cerrado
  if (SIGNUP_CLOSED) return <SignupClosed />;
  const { next } = await searchParams;
  return <SignupForm next={typeof next === "string" ? next : undefined} />;
}
