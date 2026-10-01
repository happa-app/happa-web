// Página /hogar/<id>/compra: la lista de la compra común del hogar, en vivo.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getHousehold } from "@/features/households/server";
import { ShoppingList } from "@/features/shopping";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdShoppingPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Shopping");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const household = await getHousehold(id);
  if (!household) notFound();

  const me = household.members.find((m) => m.userId === userId);
  // El casero no usa la lista de la compra del hogar
  if (!me || me.role === "landlord") notFound();

  const items = await getHouseholdShoppingItems(household.id);

  return (
    <>
      <Link href={`/hogar/${household.id}`} className={styles.back}>
        ← {household.name}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("householdSubtitle")}</p>
      </section>
      <ShoppingList
        scope={{ type: "household", householdId: household.id }}
        initialItems={items}
        currentUserId={userId}
        canManageAll={me.role === "admin" || me.role === "member"}
      />
    </>
  );
}
