// Borrar la cuenta: qué pasa, si debes dinero (entonces no se puede) o te deben, y el formulario.
import { useLocale, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/features/expenses/money";
import { Link } from "@/i18n/navigation";
import type { PendingBalance } from "../types";
import { DeleteAccountForm } from "./DeleteAccountForm";
import styles from "./Profile.module.css";

type Props = {
  isMinor: boolean;
  // Saldos pendientes en tus hogares (negativo = debes)
  balances: PendingBalance[];
};

export function DeleteAccount({ isMinor, balances }: Props) {
  const t = useTranslations("Profile.delete");
  const locale = useLocale();

  if (isMinor) {
    return (
      <Card>
        <p>{t.rich("minor", { email: (chunks) => <a href="mailto:privacidad@happa.es">{chunks}</a> })}</p>
      </Card>
    );
  }

  const owe = balances.filter((b) => b.netCents < 0);
  const owed = balances.filter((b) => b.netCents > 0);
  const pending = balances.filter((b) => b.pending > 0);
  // Con deudas o con algo sin confirmar no se puede borrar
  const blocked = owe.length > 0 || pending.length > 0;
  const list = (items: PendingBalance[], what: (b: PendingBalance) => string, className: string) => (
    <ul className={styles.balances}>
      {items.map((b) => (
        <li key={b.householdId} className={styles.balance}>
          <Link href={`/hogar/${b.householdId}/gastos`}>{b.name}</Link>
          <span className={className}>{what(b)}</span>
        </li>
      ))}
    </ul>
  );
  const money = (b: PendingBalance) => formatMoney(Math.abs(b.netCents), locale);

  return (
    <>
      <Card title={t("whatTitle")}>
        <ul className={styles.list}>
          <li>{t("what.leave")}</li>
          <li>{t("what.gone")}</li>
          <li>{t("what.stays")}</li>
          <li>
            <strong>{t("what.final")}</strong>
          </li>
        </ul>
      </Card>

      {owe.length > 0 ? (
        <Card title={t("oweTitle")}>
          <p>{t("oweText")}</p>
          {list(owe, money, styles.owe)}
        </Card>
      ) : null}
      {pending.length > 0 ? (
        <Card title={t("pendingTitle")}>
          <p>{t("pendingText")}</p>
          {list(pending, (b) => t("pendingCount", { count: b.pending }), styles.owe)}
        </Card>
      ) : null}
      {blocked ? null : (
        <>
          {owed.length > 0 ? (
            <Alert tone="error" title={t("owedTitle")}>
              <p>{t("owedText")}</p>
              {list(owed, money, styles.owed)}
            </Alert>
          ) : null}
          <Card title={t("formTitle")}>
            <DeleteAccountForm />
          </Card>
        </>
      )}
    </>
  );
}
