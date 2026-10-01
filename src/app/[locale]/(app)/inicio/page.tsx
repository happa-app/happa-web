// Página /inicio: "Mis casas". Si aún no estás en ningún hogar, te invita a crear uno o unirte.
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { HouseholdList } from "@/features/households";
import { getMyHouseholds } from "@/features/households/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

export default async function HomePage() {
  const t = await getTranslations("Households");
  const tHome = await getTranslations("Home");
  const supabase = await createClient();

  // getClaims valida la sesión. El proxy ya protege la ruta; esto es una segunda barrera.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const [{ data: profile }, households] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    getMyHouseholds(userId),
  ]);

  return (
    <>
      <section className={styles.intro}>
        <p className={styles.subtitle}>{tHome("greeting", { name: profile?.display_name ?? "" })}</p>
        <h1 className={styles.title}>{t("list.title")}</h1>
      </section>

      {households.length > 0 ? (
        <HouseholdList households={households} />
      ) : (
        <Card>
          <p>{t("empty.text")}</p>
        </Card>
      )}

      <div className={styles.actions}>
        <ButtonLink href="/hogar/nuevo" fullWidth>
          {t("actions.create")}
        </ButtonLink>
        <ButtonLink href="/unirse" variant="secondary" fullWidth>
          {t("actions.join")}
        </ButtonLink>
      </div>
    </>
  );
}
