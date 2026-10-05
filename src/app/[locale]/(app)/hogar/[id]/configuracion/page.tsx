// Página /hogar/<id>/configuracion (Más → Configuración): quién vive en el hogar, el código para
// invitar, cuántas personas caben y salir del hogar.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  ConfirmSubmitButton,
  InvitePanel,
  isFull,
  leaveHousehold,
  MemberList,
  Occupancy,
  PlacesForm,
  regenerateInviteCode,
  residentCount,
} from "@/features/households";
import { getHousehold } from "@/features/households/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdSettingsPage({ params }: Props) {
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
  const residents = residentCount(household.members);
  const full = isFull(residents, household.maxMembers);

  return (
    <>
      <Link href={`/hogar/${household.id}/mas`} className={styles.back}>
        ← {t("settings.back")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("settings.title")}</h1>
        <p className={styles.subtitle}>{household.name}</p>
      </section>

      <Card title={t("membersSection.title")}>
        <Occupancy residents={residents} places={household.maxMembers} />
        <MemberList members={household.members} currentUserId={userId} />
      </Card>

      {isAdult ? (
        <Card title={t("invite.title")}>
          {full ? (
            <p className={styles.notice}>{isAdmin ? t("invite.fullAdmin") : t("invite.full")}</p>
          ) : (
            <p className={styles.subtitle}>{t("invite.text")}</p>
          )}
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

      <Card title={t("places.title")}>
        {isAdmin ? (
          <>
            <p className={styles.subtitle}>{t("places.text")}</p>
            <PlacesForm householdId={household.id} places={household.maxMembers} residents={residents} />
          </>
        ) : (
          <p className={styles.subtitle}>{t("places.readonly", { count: household.maxMembers })}</p>
        )}
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
