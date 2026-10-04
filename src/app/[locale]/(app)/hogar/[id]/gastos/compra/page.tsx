// Página /hogar/<id>/gastos/compra: pasar lo comprado de la lista común a un gasto.
// Se eligen los productos, se apunta lo que costó y, al guardar, salen de la lista de la compra.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ExpenseForm, todayIn, uuidSchema } from "@/features/expenses";
import { getBalances, getExpensesContext } from "@/features/expenses/server";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShoppingExpensePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Expenses");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  // Solo adultos que viven en el hogar
  const context = await getExpensesContext(id);
  if (!context?.isCurrent) notFound();

  const [people, items] = await Promise.all([getBalances(id), getHouseholdShoppingItems(id)]);
  const adults = people.filter((p) => p.isCurrent).map((p) => ({ userId: p.userId, name: p.name }));
  // Comprados, los más antiguos primero (en el orden en que se metieron en el carro)
  const bought = items
    .filter((i) => i.checkedAt)
    .sort((a, b) => (a.checkedAt ?? "").localeCompare(b.checkedAt ?? ""))
    .map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, checkedBy: i.checkedBy }));

  return (
    <>
      <Link href={`/hogar/${id}/gastos`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("fromShopping.title")}</h1>
        <p className={styles.subtitle}>{t("fromShopping.subtitle")}</p>
      </section>
      {bought.length === 0 ? (
        <>
          <p className={styles.muted}>{t("fromShopping.empty")}</p>
          <ButtonLink href={`/hogar/${id}/compra`} variant="secondary" fullWidth>
            {t("fromShopping.toList")}
          </ButtonLink>
        </>
      ) : (
        <ExpenseForm
          householdId={id}
          currentUserId={userId}
          people={adults}
          today={todayIn(context.timezone)}
          boughtItems={bought}
        />
      )}
    </>
  );
}
