// Página /inicio (privada). De momento saluda y permite cerrar sesión;
// en el siguiente paso mostrará tus hogares o el alta de uno nuevo.
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/features/auth";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./inicio.module.css";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const supabase = await createClient();

  // getClaims valida la sesión. El proxy ya protege la ruta; esto es una segunda barrera.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <SignOutButton />
      </header>
      <section className={styles.card}>
        <h1 className={styles.greeting}>{t("greeting", { name: profile?.display_name ?? "" })}</h1>
        <p>{t("noHousehold")}</p>
        <p className={styles.muted}>{t("nextStep")}</p>
      </section>
    </main>
  );
}
