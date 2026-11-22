// Columna de Pagos del corcho (solo la reciben los adultos): para qué es, Bizum o IBAN, el número y «Copiar».
// El IBAN largo se enseña recortado, pero se copia entero.
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { formatBizum, maskIban } from "../logic";
import type { BoardPayment } from "../types";
import { BoardActionButton } from "./BoardActionButton";
import { CopyButton } from "./CopyButton";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  payments: BoardPayment[];
};

export function PaymentsSection({ householdId, payments }: Props) {
  const t = useTranslations("Board");
  const link =
    payments.length < 10
      ? { href: `/hogar/${householdId}/corcho/pago`, label: t("payments.add"), ariaLabel: t("payments.addAria") }
      : undefined;

  return (
    <Section title={t("payments.title")} link={link}>
      {payments.length === 0 ? (
        <p className={styles.empty}>{t("payments.empty")}</p>
      ) : (
        <ul className={styles.payments}>
          {payments.map((p) => (
            <li key={p.id} className={styles.payment}>
              <p className={styles.paymentLabel}>
                {p.label} <span className={styles.kind}>{t(`payments.${p.kind}`)}</span>
              </p>
              <div className={styles.paymentLine}>
                <span className={styles.number}>{p.kind === "bizum" ? formatBizum(p.value) : maskIban(p.value)}</span>
                <CopyButton
                  text={p.value}
                  look="link"
                  ariaLabel={t("payments.copyAria", { kind: t(`payments.${p.kind}`), label: p.label })}
                />
              </div>
              <BoardActionButton
                householdId={householdId}
                intent="deletePayment"
                fields={{ paymentId: p.id }}
                label={t("payments.remove")}
                ariaLabel={t("payments.removeAria", { label: p.label })}
                confirmText={t("payments.removeConfirm", { label: p.label })}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
