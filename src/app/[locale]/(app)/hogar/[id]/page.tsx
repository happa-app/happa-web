// Página /hogar/<id>: el hogar con sus secciones (lista de la compra con lo que falta, triqui;
// luego tareas), los miembros, la invitación y la opción de salir.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  ConfirmSubmitButton,
  InvitePanel,
  leaveHousehold,
  MemberList,
  regenerateInviteCode,
} from "@/features/households";
import { getHousehold } from "@/features/households/server";
import { ShoppingPreview } from "@/features/shopping";
import { getHouseholdShoppingItems } from "@/features/shopping/server";
import { TriquiTile } from "@/features/triqui";
import { getMyTriquiSummary } from "@/features/triqui/server";
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
  const isAdmin = me?.role === "admin";
  const isResident = isAdult || me?.role === "minor";
  // El triqui solo es para adultos (ni menores ni casero)
  const [shoppingItems, triqui] = await Promise.all([
    isResident ? getHouseholdShoppingItems(household.id) : [],
    isAdult ? getMyTriquiSummary(household.id, userId) : null,
  ]);

  return (
    <>
      <Link href="/inicio" className={styles.back}>
        ← {t("detail.back")}
      </Link>

      <section className={styles.intro}>
        <h1 className={styles.title}>{household.name}</h1>
        <p className={styles.subtitle}>
          {t(`kinds.${household.kind}`)} · {t("memberCount", { count: household.members.length })}
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
          {triqui ? (
            <TriquiTile href={`/hogar/${household.id}/triqui`} netCents={triqui.netCents} toConfirm={triqui.toConfirm} />
          ) : null}
          <p className={styles.muted}>{t("detail.comingSoon")}</p>
        </nav>
      ) : null}

      {isAdult ? (
        <Card title={t("invite.title")}>
          <p className={styles.subtitle}>{t("invite.text")}</p>
          <InvitePanel code={household.inviteCode} householdName={household.name} />
          {isAdmin ? (
            <ConfirmSubmitButton
              action={regenerateInviteCode}
              householdId={household.id}
              label={t("invite.regenerate")}
              confirmText={t("invite.regenerateConfirm")}
            />
          ) : null}
        </Card>
      ) : null}

      <Card title={t("membersSection.title")}>
        <MemberList members={household.members} currentUserId={userId} />
      </Card>

      <ConfirmSubmitButton
        action={leaveHousehold}
        householdId={household.id}
        label={t("leave.button")}
        confirmText={t("leave.confirm", { name: household.name })}
      />
    </>
  );
}
