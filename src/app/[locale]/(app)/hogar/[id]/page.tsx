// Página /hogar/<id>: el hogar con sus miembros, la invitación y la opción de salir.
// Aquí irán después la lista de la compra, el triqui y las tareas.
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

      <Card>
        <p className={styles.muted}>{t("detail.comingSoon")}</p>
      </Card>

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
