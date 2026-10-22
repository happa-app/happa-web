// Página /recuperar ("¿Has olvidado tu contraseña?"). Es pública: se llega sin sesión.
import { ForgotPasswordForm } from "@/features/auth";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return <ForgotPasswordForm linkExpired={error === "caducado"} />;
}
