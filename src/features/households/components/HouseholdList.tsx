// Lista "Mis casas": una tarjeta por hogar que lleva a su página.
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/navigation";
import type { HouseholdSummary } from "../types";
import styles from "./HouseholdList.module.css";

type Props = {
  households: HouseholdSummary[];
};

export function HouseholdList({ households }: Props) {
  const t = useTranslations("Households");

  return (
    <ul className={styles.list}>
      {households.map((h) => (
        <li key={h.id}>
          <Link href={`/hogar/${h.id}`} className={styles.item}>
            <Avatar name={h.name} />
            <span className={styles.text}>
              <span className={styles.name}>{h.name}</span>
              <span className={styles.meta}>
                {t(`kinds.${h.kind}`)} · {t("occupancy", { count: h.memberCount, max: h.maxMembers })}
              </span>
            </span>
            {h.role === "admin" ? <span className={styles.badge}>{t("roles.admin")}</span> : null}
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
