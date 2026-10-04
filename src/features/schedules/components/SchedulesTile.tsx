// Acceso a los horarios desde la página del hogar: cuántos hay en casa ahora.
import { useTranslations } from "next-intl";
import { ClockIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import styles from "./Schedules.module.css";

type Props = {
  href: string;
  // Personas en casa ahora y total de quienes viven aquí
  home: number;
  total: number;
  // ¿Hay algo apuntado (franjas o ausencias)?
  hasAnything: boolean;
};

export function SchedulesTile({ href, home, total, hasAnything }: Props) {
  const t = useTranslations("Schedules");
  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.tileIcon}>
        <ClockIcon />
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{t("title")}</span>
        <span className={styles.muted}>{hasAnything ? t("tile.home", { home, total }) : t("tile.empty")}</span>
      </span>
      <span className={styles.tileChevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
