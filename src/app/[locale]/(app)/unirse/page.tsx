// Página /unirse: escribir o pegar el código (o el enlace) de invitación.
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { JoinHouseholdForm } from "@/features/households";
import { Link } from "@/i18n/navigation";
import styles from "../page.module.css";

export default async function JoinPage() {
  const t = await getTranslations("Households");

  return (
    <>
      <Link href="/inicio" className={styles.back}>
        ← {t("detail.back")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("join.title")}</h1>
        <p className={styles.subtitle}>{t("join.subtitle")}</p>
      </section>
      <Card>
        <JoinHouseholdForm />
      </Card>
    </>
  );
}
