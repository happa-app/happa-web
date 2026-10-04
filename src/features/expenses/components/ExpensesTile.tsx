// Acceso a gastos desde la página del hogar: tu saldo y cuántas cosas esperan que las confirmes.
import { useLocale, useTranslations } from "next-intl";
import { WalletIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "../money";
import styles from "./Expenses.module.css";

type Props = { href: string; netCents: number; toConfirm: number };

export function ExpensesTile({ href, netCents, toConfirm }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const amount = formatMoney(Math.abs(netCents), locale);

  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.tileIcon}>
        <WalletIcon />
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{t("title")}</span>
        <span className={netCents > 0 ? styles.owed : netCents < 0 ? styles.owe : styles.muted}>
          {netCents > 0 ? t("tile.owed", { amount }) : netCents < 0 ? t("tile.owe", { amount }) : t("tile.even")}
        </span>
        {toConfirm > 0 ? <span className={styles.tileBadge}>{t("tile.toConfirm", { count: toConfirm })}</span> : null}
      </span>
      <span className={styles.tileChevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
