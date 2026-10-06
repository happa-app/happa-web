// Tus hogares: en cuáles estás, con qué papel y cuánta gente hay. Cada uno lleva a su Inicio.
import { useTranslations } from "next-intl";
import { HousesIcon } from "@/components/brand/Icons";
import type { HouseholdSummary } from "@/features/households";
import { MenuList } from "@/features/navigation";
import { Link } from "@/i18n/navigation";
import styles from "./Profile.module.css";

export function ProfileHouseholds({ households }: { households: HouseholdSummary[] }) {
  const t = useTranslations("Profile.households");
  const th = useTranslations("Households");

  if (households.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="profile-households">
        <h2 id="profile-households" className={styles.sectionTitle}>
          {t("title")}
        </h2>
        <p className={styles.empty}>
          {t.rich("empty", { link: (chunks) => <Link href="/inicio">{chunks}</Link> })}
        </p>
      </section>
    );
  }

  return (
    <MenuList
      title={t("title")}
      items={households.map((h) => ({
        href: `/hogar/${h.id}`,
        icon: <HousesIcon />,
        title: h.name,
        description: `${th(`roles.${h.role}`)} · ${th("occupancy", { count: h.memberCount, max: h.maxMembers })}`,
      }))}
    />
  );
}
