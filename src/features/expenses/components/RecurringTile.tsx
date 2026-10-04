// Acceso a los gastos fijos desde la pantalla de gastos: cuántos hay activos y cuántos esperan
// tu confirmación.
import { useTranslations } from "next-intl";
import { RepeatIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import { recurringWaitingForMe } from "../format";
import type { RecurringExpense } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  href: string;
  recurring: RecurringExpense[];
  currentUserId: string;
  // Adultos que viven ahora en el hogar (si quien paga se fue, ese gasto fijo está parado)
  currentIds: Set<string>;
};

export function RecurringTile({ href, recurring, currentUserId, currentIds }: Props) {
  const t = useTranslations("Expenses");
  const active = recurring.filter((r) => r.status === "confirmed" && r.active && currentIds.has(r.paidBy)).length;
  const toConfirm = recurring.filter((r) => recurringWaitingForMe(r, currentUserId)).length;

  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.tileIcon}>
        <RepeatIcon />
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{t("recurring.title")}</span>
        <span className={styles.muted}>
          {recurring.length === 0 ? t("recurring.tileEmpty") : t("recurring.tileActive", { count: active })}
        </span>
        {toConfirm > 0 ? <span className={styles.tileBadge}>{t("tile.toConfirm", { count: toConfirm })}</span> : null}
      </span>
      <span className={styles.tileChevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
