// Página /hogar/nuevo: formulario para crear un hogar.
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { CreateHouseholdForm } from "@/features/households";
import { Link } from "@/i18n/navigation";
import styles from "../../page.module.css";

export default async function NewHouseholdPage() {
  const t = await getTranslations("Households");

  return (
    <>
      <Link href="/inicio" className={styles.back}>
        ← {t("detail.back")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("create.title")}</h1>
        <p className={styles.subtitle}>{t("create.subtitle")}</p>
      </section>
      <Card>
        <CreateHouseholdForm />
      </Card>
    </>
  );
}
