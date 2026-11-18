// Filas que llevan a cada conversación de «Cuentas pendientes», dentro de una franja con rayas gruesas.
//   · household (pestaña Chat de quien sigue en el hogar): «Bruno te debe 15,20 €», con los mensajes nuevos.
//   · home (Inicio de quien se fue): «Piso de prueba · debes 15,20 €».
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatMoney } from "@/features/expenses/money";
import { Link } from "@/i18n/navigation";
import type { DebtChatItem } from "../queries";
import styles from "./Debts.module.css";

type Props = {
  items: DebtChatItem[];
  variant: "household" | "home";
};

export function DebtChatList({ items, variant }: Props) {
  const t = useTranslations("Chat.debts");
  const locale = useLocale();
  if (items.length === 0) return null;

  return (
    <nav className={styles.strip} aria-label={t("listLabel")}>
      {items.map((item) => {
        const amount = item.line ? formatMoney(item.line.amountCents, locale) : null;
        const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
        let title: ReactNode;
        let sub: string;
        if (variant === "home") {
          title = <strong>{item.householdName}</strong>;
          sub = !item.line
            ? t("title")
            : item.line.direction === "iOwe"
              ? t("homeIOwe", { amount: amount ?? "" })
              : t("homeOwesMe", { amount: amount ?? "" });
        } else {
          // En el hogar: la conversación es de quien se fue (item.departedName)
          title = !item.line
            ? <strong>{item.departedName}</strong>
            : item.line.direction === "owesMe"
              ? t.rich("rowOwesMe", { name: item.departedName, amount: amount ?? "", strong })
              : t.rich("rowIOwe", { name: item.otherName ?? item.departedName, amount: amount ?? "", strong });
          sub = item.unread > 0 ? t("rowSubUnread", { count: item.unread }) : t("title");
        }
        return (
          <Link key={item.conversationId} href={`/cuentas-pendientes/${item.conversationId}`} className={styles.rowLink}>
            <span className={styles.text}>
              {title}
              <span className={styles.sub}>{sub}</span>
            </span>
            <span className={styles.rowEnd}>
              {item.unread > 0 ? (
                <span className={styles.badge} aria-label={t("unread", { count: item.unread })}>
                  {item.unread}
                </span>
              ) : null}
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
