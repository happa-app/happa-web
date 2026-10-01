// Página /compra: la lista personal (solo la ves tú). Desde aquí puedes pedir cosas a tus hogares.
import { getLocale, getTranslations } from "next-intl/server";
import { getMyHouseholds } from "@/features/households/server";
import { ShoppingList } from "@/features/shopping";
import { getPersonalShoppingItems } from "@/features/shopping/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

export default async function PersonalShoppingPage() {
  const t = await getTranslations("Shopping");
  const tHouseholds = await getTranslations("Households");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const [items, households] = await Promise.all([getPersonalShoppingItems(userId), getMyHouseholds(userId)]);
  const shareTargets = households
    .filter((h) => h.role !== "landlord")
    .map((h) => ({ id: h.id, name: h.name }));

  return (
    <>
      <Link href="/inicio" className={styles.back}>
        ← {tHouseholds("detail.back")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("personalTitle")}</h1>
        <p className={styles.subtitle}>{t("personalSubtitle")}</p>
      </section>
      <ShoppingList
        scope={{ type: "personal", userId }}
        initialItems={items}
        currentUserId={userId}
        canManageAll
        shareTargets={shareTargets}
      />
    </>
  );
}
