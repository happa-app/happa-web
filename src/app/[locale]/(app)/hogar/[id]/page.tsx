// Página /hogar/<id> (pestaña "Inicio" de la barra de abajo): el hogar con lo que falta en la compra y un
// resumen de gastos, horarios y tareas (cada uno con su página para verlo todo). El chat tiene su pestaña;
// las personas, la invitación, las plazas y salir del hogar están en Más → Configuración.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { residentCount } from "@/features/households";
import { getHousehold } from "@/features/households/server";
import { ShoppingPreview } from "@/features/shopping";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { ExpensesHome } from "@/features/expenses";
import { getExpensesHome } from "@/features/expenses/server";
import { nowIn, SchedulesHome } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { ChoresHome } from "@/features/chores";
import { getChoresOverview } from "@/features/chores/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Households");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const household = await getHousehold(id);
  if (!household) notFound();

  const me = household.members.find((m) => m.userId === userId);
  const isAdult = me?.role === "admin" || me?.role === "member";
  const isResident = isAdult || me?.role === "minor";
  // Los gastos solo son para adultos (ni menores ni casero); horarios y tareas, para quienes viven aquí
  const [shoppingItems, expenses, schedules, chores] = await Promise.all([
    isResident ? getHouseholdShoppingItems(household.id) : [],
    isAdult ? getExpensesHome(household.id, userId) : null,
    isResident ? getScheduleOverview(household.id, userId) : null,
    isResident ? getChoresOverview(household.id, userId) : null,
  ]);

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{household.name}</h1>
        <p className={styles.subtitle}>
          {t(`kinds.${household.kind}`)} ·{" "}
          <Link href={`/hogar/${household.id}/configuracion`} className={styles.subtleLink}>
            {t("occupancy", { count: residentCount(household.members), max: household.maxMembers })}
          </Link>
        </p>
      </section>

      {isResident ? (
        <>
          <ShoppingPreview
            householdId={household.id}
            initialItems={shoppingItems}
            currentUserId={userId}
            canManageAll={isAdult}
            href={`/hogar/${household.id}/compra`}
          />
          {expenses ? <ExpensesHome householdId={household.id} currentUserId={userId} data={expenses} /> : null}
          {schedules ? (
            <SchedulesHome
              householdId={household.id}
              people={schedules.people}
              blocks={schedules.blocks}
              absences={schedules.absences}
              now={nowIn(schedules.timezone)}
              currentUserId={userId}
            />
          ) : null}
          {chores ? <ChoresHome householdId={household.id} overview={chores} currentUserId={userId} /> : null}
          <p className={styles.muted}>{t("detail.comingSoon")}</p>
        </>
      ) : null}
    </>
  );
}
