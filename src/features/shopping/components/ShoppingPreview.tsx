"use client";
// Acceso a la lista de la compra desde la página del hogar, con lo que falta por comprar.
// Va en vivo, igual que la lista: si alguien añade o compra algo, se ve aquí al momento.
import { useTranslations } from "next-intl";
import { CartIcon } from "@/components/brand/Icons";
import { Link } from "@/i18n/navigation";
import { useShoppingList } from "../hooks/useShoppingList";
import type { ShoppingItem } from "../types";
import styles from "./ShoppingPreview.module.css";

// Cuántos productos se enseñan como mucho; el resto sale como "+N más".
const PREVIEW_LIMIT = 6;

type Props = {
  householdId: string;
  initialItems: ShoppingItem[];
  // Página de la lista completa
  href: string;
};

export function ShoppingPreview({ householdId, initialItems, href }: Props) {
  const t = useTranslations("Shopping");
  const { items } = useShoppingList({ type: "household", householdId }, initialItems);

  const pending = items.filter((i) => !i.checkedAt);
  const shown = pending.slice(0, PREVIEW_LIMIT);
  const hidden = pending.length - shown.length;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>
          <CartIcon />
        </span>
        <span className={styles.text}>
          {/* El enlace cubre toda la tarjeta (ver .link::after en el CSS) */}
          <Link href={href} className={styles.link}>
            {t("title")}
          </Link>
          <span className={styles.count}>{t("pendingCount", { count: pending.length })}</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </div>

      {shown.length > 0 ? (
        <ul className={styles.chips} aria-label={t("pending")}>
          {shown.map((item) => (
            <li key={item.id} className={styles.chip}>
              {item.name}
              {item.quantity ? <span className={styles.quantity}>{item.quantity}</span> : null}
            </li>
          ))}
          {hidden > 0 ? <li className={styles.more}>{t("previewMore", { count: hidden })}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
