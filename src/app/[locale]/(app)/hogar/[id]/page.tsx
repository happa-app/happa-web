// Página /hogar/<id> (pestaña "Inicio" de la barra de abajo): el hogar con sus secciones (lista de la
// compra con lo que falta, chat, gastos, horarios y tareas). Las personas, la invitación, las plazas y
// salir del hogar están en Más → Configuración.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { residentCount } from "@/features/households";
import { getHousehold } from "@/features/households/server";
import { ShoppingPreview } from "@/features/shopping";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { ExpensesTile } from "@/features/expenses";
import { getMyExpensesSummary } from "@/features/expenses/server";
import { nowIn, presenceAt, SchedulesTile } from "@/features/schedules";
import { getScheduleOverview } from "@/features/schedules/server";
import { ChoresTile } from "@/features/chores";
import { getChoresSummary } from "@/features/chores/server";
import { ChatTile } from "@/features/chat";
import { getChatSummary } from "@/features/chat/server";
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
  // Los gastos solo son para adultos (ni menores ni casero)
  const [shoppingItems, expenses, schedules, chores, chat] = await Promise.all([
    isResident ? getHouseholdShoppingItems(household.id) : [],
    isAdult ? getMyExpensesSummary(household.id, userId) : null,
    // Los horarios, para quienes viven aquí (adultos y menores)
    isResident ? getScheduleOverview(household.id, userId) : null,
    // Las tareas, también para quienes viven aquí
    isResident ? getChoresSummary(household.id, userId, isAdult) : null,
    // El chat de inquilinos (también para menores)
    isResident ? getChatSummary(household.id) : null,
  ]);
  const now = schedules ? nowIn(schedules.timezone) : null;
  const homeNow =
    schedules && now
      ? schedules.people.filter((p) => presenceAt(p.userId, schedules.blocks, schedules.absences, now).state === "home").length
      : 0;

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
        <nav className={styles.tiles} aria-label={household.name}>
          <ShoppingPreview
            householdId={household.id}
            initialItems={shoppingItems}
            currentUserId={userId}
            canManageAll={isAdult}
            href={`/hogar/${household.id}/compra`}
          />
          {chat ? (
            <ChatTile href={`/hogar/${household.id}/chat`} summary={chat.summary} lastSenderName={chat.lastSenderName} me={userId} />
          ) : null}
          {expenses ? (
            <ExpensesTile href={`/hogar/${household.id}/gastos`} netCents={expenses.netCents} toConfirm={expenses.toConfirm} />
          ) : null}
          {schedules ? (
            <SchedulesTile
              href={`/hogar/${household.id}/horarios`}
              home={homeNow}
              total={schedules.people.length}
              hasAnything={schedules.blocks.length > 0 || schedules.absences.length > 0}
            />
          ) : null}
          {chores ? <ChoresTile href={`/hogar/${household.id}/tareas`} summary={chores} /> : null}
          <p className={styles.muted}>{t("detail.comingSoon")}</p>
        </nav>
      ) : null}
    </>
  );
}
