// Página /login. Solo compone: el formulario y su lógica viven en features/auth.
import { LoginForm } from "@/features/auth";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  return (
    <LoginForm
      confirmFailed={error === "confirm"}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
