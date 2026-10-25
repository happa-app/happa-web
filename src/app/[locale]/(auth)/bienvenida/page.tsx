// Página /bienvenida ("Antes de empezar"): la primera vez que alguien entra con Google, aceptar los términos,
// confirmar la edad y las opciones de privacidad. Es privada (hace falta la sesión de Google). Si ya está
// hecho, lleva directamente a la app.
import { getLocale } from "next-intl/server";
import { redirect as redirectToPath } from "next/navigation";
import { WelcomeForm } from "@/features/auth";
import { needsSignupCompletion } from "@/features/auth/server";
import { getMyProfile } from "@/features/profile/server";
import { redirect } from "@/i18n/navigation";
import { safeNextPath } from "@/utils/safe-path";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WelcomePage({ searchParams }: Props) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null) ?? undefined;
  const locale = await getLocale();

  const [pending, profile] = await Promise.all([needsSignupCompletion(), getMyProfile()]);
  if (!profile) return redirect({ href: "/login", locale });
  if (!pending) {
    if (next) redirectToPath(next);
    return redirect({ href: "/inicio", locale });
  }

  return <WelcomeForm name={profile.name} email={profile.email ?? ""} next={next} />;
}
