// Página /unirse/<código>: la que abre el enlace de invitación.
// Muestra a qué hogar te invitan y te deja confirmar. Sin sesión, el proxy te manda
// antes al login y después vuelves aquí.
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { JoinHouseholdForm, normalizeInviteCode } from "@/features/households";
import { getInvitePreview } from "@/features/households/server";
import styles from "../../page.module.css";

type Props = {
  params: Promise<{ codigo: string }>;
};

export default async function InvitePage({ params }: Props) {
  const t = await getTranslations("Households");
  const code = normalizeInviteCode(decodeURIComponent((await params).codigo));
  const preview = await getInvitePreview(code);

  if (!preview) {
    return (
      <Card title={t("preview.title")}>
        <p>{t("preview.invalid")}</p>
        <ButtonLink href="/unirse" variant="secondary" fullWidth>
          {t("preview.typeCode")}
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card title={t("preview.title")}>
      <section className={styles.intro}>
        <p className={styles.subtitle}>{t("preview.intro")}</p>
        <p className={styles.title}>{preview.name}</p>
        <p className={styles.muted}>
          {t(`kinds.${preview.kind}`)} · {t("memberCount", { count: preview.memberCount })}
        </p>
      </section>
      {preview.alreadyMember ? (
        <>
          <p>{t("preview.alreadyMember")}</p>
          <ButtonLink href={`/hogar/${preview.householdId}`} fullWidth>
            {t("preview.goToHousehold")}
          </ButtonLink>
        </>
      ) : (
        <JoinHouseholdForm code={code} householdName={preview.name} />
      )}
    </Card>
  );
}
