// Página /registro. Solo compone: el formulario y su lógica viven en features/auth.
import { SignupForm } from "@/features/auth";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <SignupForm next={typeof next === "string" ? next : undefined} />;
}
