// Página /nueva-contrasena: se llega desde el enlace del correo de recuperación (ya con la sesión iniciada).
// Si no vienes de ese enlace, o ha pasado demasiado tiempo, se vuelve a /recuperar a pedir otro.
import { getLocale } from "next-intl/server";
import { NewPasswordForm } from "@/features/auth";
import { hasRecoverySession } from "@/features/auth/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user?.email || !(await hasRecoverySession(supabase))) {
    return redirect({ href: { pathname: "/recuperar", query: { error: "caducado" } }, locale: await getLocale() });
  }

  return <NewPasswordForm email={data.user.email} />;
}
