// Gastos en Inicio: tu saldo, lo que espera que lo confirmes, cómo quedar en paz y los últimos gastos.
// Todo lo demás (apuntar pagos, el historial, los gastos fijos) está en su página.
import { useLocale, useTranslations } from "next-intl";
import { WalletIcon } from "@/components/brand/Icons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HomeSection, homeStyles } from "@/components/ui/HomeSection";
import { Link } from "@/i18n/navigation";
import { formatDay, nameMap } from "../format";
import { formatMoney } from "../money";
import { suggestTransfers } from "../settle";
import type { ExpensesHome as ExpensesHomeData } from "../types";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  currentUserId: string;
  data: ExpensesHomeData;
};

export function ExpensesHome({ householdId, currentUserId, data }: Props) {
  const t = useTranslations("Expenses");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const base = `/hogar/${householdId}/gastos`;
  const names = nameMap(data.people);
  const name = (id: string) => names.get(id) ?? t("someone");
  const amount = formatMoney(Math.abs(data.netCents), locale);
  const list = new Intl.ListFormat(locale, { type: "conjunction" });

  // Solo los pagos sugeridos en los que estás tú
  const mine = suggestTransfers(data.people).filter((tr) => tr.from === currentUserId || tr.to === currentUserId);

  return (
    <HomeSection
      title={t("title")}
      icon={<WalletIcon />}
      href={base}
      linkLabel={tHome("seeAll")}
      linkAriaLabel={tHome("seeAllOf", { section: t("title") })}
    >
      <div className={homeStyles.card}>
        <div className={styles.homeBalance}>
          <p className={data.netCents > 0 ? styles.homeOwed : data.netCents < 0 ? styles.homeOwe : styles.homeEven}>
            {data.netCents > 0 ? t("tile.owed", { amount }) : data.netCents < 0 ? t("tile.owe", { amount }) : t("tile.even")}
          </p>
          {data.toConfirm > 0 ? (
            <Link href={base} className={styles.homeBadge}>
              {t("tile.toConfirm", { count: data.toConfirm })}
            </Link>
          ) : null}
        </div>

        {mine.length > 0 ? (
          <div>
            <p className={homeStyles.label}>{t("settle.title")}</p>
            <ul className={homeStyles.list}>
              {mine.map((tr) => (
                <li key={`${tr.from}-${tr.to}`} className={homeStyles.row}>
                  <span className={homeStyles.rowTitle}>
                    {tr.from === currentUserId ? t("home.youPay", { name: name(tr.to) }) : t("home.paysYou", { name: name(tr.from) })}
                  </span>
                  <span className={homeStyles.rowValue}>{formatMoney(tr.amountCents, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className={homeStyles.label}>{t("home.recent")}</p>
          {data.recent.length === 0 ? (
            <p className={homeStyles.muted}>{t("home.noExpenses")}</p>
          ) : (
            <ul className={homeStyles.list}>
              {data.recent.map((expense) => {
                const payers = list.format(
                  expense.payers.map((p) => (p.userId === currentUserId ? t("youObject") : name(p.userId))),
                );
                return (
                  <li key={expense.id}>
                    <Link href={`${base}/${expense.id}`} className={homeStyles.row}>
                      <span className={homeStyles.rowMain}>
                        <span className={homeStyles.rowTitle}>{expense.description}</span>
                        <span className={homeStyles.rowMeta}>
                          {t("home.paidBy", { names: payers, date: formatDay(expense.spentOn, locale) })}
                          {expense.status === "pending" ? ` · ${t("home.pending")}` : null}
                        </span>
                      </span>
                      <span className={homeStyles.rowValue}>{formatMoney(expense.amountCents, locale)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ButtonLink href={`${base}/nuevo`} variant="secondary" fullWidth>
          {t("addExpense")}
        </ButtonLink>
      </div>
    </HomeSection>
  );
}
