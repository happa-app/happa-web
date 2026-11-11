// Gastos en Inicio: tu saldo, lo que espera que lo confirmes y la balanza de lo que hay con cada persona.
// Todo lo demás (apuntar pagos, el historial, los gastos fijos) está en su página.
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HomeSection, homeStyles } from "@/components/ui/HomeSection";
import { Link } from "@/i18n/navigation";
import { nameMap } from "../format";
import { formatMoney } from "../money";
import { myBalanceBars, suggestTransfers } from "../settle";
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

  // La balanza: los pagos sugeridos en los que estás tú, con su longitud ya calculada
  // "Estáis en paz" solo si nadie del hogar debe nada; si no, "Estás en paz" (tú sí, otros no)
  const everyoneEven = data.people.every((p) => p.netCents === 0);
  const bars = myBalanceBars(suggestTransfers(data.people), currentUserId);

  return (
    <HomeSection
      title={t("title")}
      href={base}
      linkLabel={tHome("seeAll")}
      linkAriaLabel={tHome("seeAllOf", { section: t("title") })}
    >
      <div className={homeStyles.card}>
        <div className={styles.homeBalance}>
          <p className={data.netCents > 0 ? styles.homeOwed : data.netCents < 0 ? styles.homeOwe : styles.homeEven}>
            {data.netCents > 0 ? t("tile.owed", { amount }) : data.netCents < 0 ? t("tile.owe", { amount }) : everyoneEven ? t("tile.even") : t("home.youEven")}
          </p>
          {data.toConfirm > 0 ? (
            <Link href={base} className={styles.homeBadge}>
              {t("tile.toConfirm", { count: data.toConfirm })}
            </Link>
          ) : null}
        </div>

        {bars.length > 0 ? (
          <ul className={styles.balance}>
            {bars.map((bar) => {
              const money = formatMoney(bar.amountCents, locale);
              return (
                <li key={bar.userId} className={styles.balanceRow}>
                  <span className="visually-hidden">
                    {bar.owesMe
                      ? t("home.owesYou", { name: name(bar.userId), amount: money })
                      : t("home.youOwe", { name: name(bar.userId), amount: money })}
                  </span>
                  <span className={styles.balanceName} aria-hidden="true">
                    {name(bar.userId)}
                  </span>
                  {/* Dos mitades: a la izquierda lo que debes, a la derecha lo que te deben */}
                  <span className={styles.balanceHalfLeft} aria-hidden="true">
                    {bar.owesMe ? null : <span className={styles.barOwe} style={{ width: `${bar.widthPct}%` }} />}
                  </span>
                  <span className={styles.balanceHalfRight} aria-hidden="true">
                    {bar.owesMe ? <span className={styles.barOwed} style={{ width: `${bar.widthPct}%` }} /> : null}
                  </span>
                  <span
                    className={`${styles.balanceAmount} ${bar.owesMe ? styles.homeOwed : styles.homeOwe}`}
                    aria-hidden="true"
                  >
                    {bar.owesMe ? "" : "−"}
                    {money}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <ButtonLink href={`${base}/nuevo`} variant="secondary" fullWidth>
          {t("addExpense")}
        </ButtonLink>
      </div>
    </HomeSection>
  );
}
