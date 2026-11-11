"use client";
// Acceso a la lista de la compra desde la página del hogar, con lo que falta por comprar.
// Va en vivo, igual que la lista: si alguien añade o compra algo, se ve aquí al momento.
// Tocar un producto lo marca como comprado (con "Deshacer" unos segundos); la lista completa
// se abre con "ver lista ›" de la cabecera.
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { HomeSection } from "@/components/ui/HomeSection";
import { useShoppingList } from "../hooks/useShoppingList";
import { canEditItem, shownQuantity } from "../rules";
import type { ShoppingItem } from "../types";
import styles from "./ShoppingPreview.module.css";

// Cuántos productos se enseñan como mucho; el resto sale como "+N más".
const PREVIEW_LIMIT = 6;
// Cuánto tiempo se ofrece "Deshacer" tras marcar algo como comprado.
const UNDO_MS = 6000;

type Props = {
  householdId: string;
  initialItems: ShoppingItem[];
  currentUserId: string;
  // Adultos del hogar: pueden marcar cualquier producto. Menores: solo lo que pidieron.
  canManageAll: boolean;
  // Página de la lista completa
  href: string;
};

export function ShoppingPreview({ householdId, initialItems, currentUserId, canManageAll, href }: Props) {
  const t = useTranslations("Shopping");
  const tHome = useTranslations("Home");
  const { items, error, toggle } = useShoppingList({ type: "household", householdId }, initialItems);
  const [lastBoughtId, setLastBoughtId] = useState<string | null>(null);

  const pending = items.filter((i) => !i.checkedAt);
  const shown = pending.slice(0, PREVIEW_LIMIT);
  const hidden = pending.length - shown.length;

  // Lo último que has marcado desde aquí, mientras siga comprado (por si otra persona lo desmarca)
  const lastBought = items.find((i) => i.id === lastBoughtId && i.checkedAt) ?? null;

  // "Deshacer" desaparece solo al cabo de unos segundos
  useEffect(() => {
    if (!lastBoughtId) return;
    const timer = setTimeout(() => setLastBoughtId(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [lastBoughtId]);

  function onBuy(item: ShoppingItem) {
    setLastBoughtId(item.id);
    void toggle(item);
  }

  function onUndo() {
    if (!lastBought) return;
    setLastBoughtId(null);
    void toggle(lastBought);
  }

  return (
    <HomeSection
      title={t("home.title")}
      meta={pending.length > 0 ? String(pending.length) : undefined}
      href={href}
      linkLabel={tHome("seeList")}
      linkAriaLabel={tHome("seeAllOf", { section: t("title") })}
    >
      {shown.length > 0 ? (
        <ul className={styles.chips} aria-label={t("pending")}>
          {shown.map((item) => (
            <li key={item.id}>
              {canEditItem(item, currentUserId, canManageAll) && !item.pending ? (
                <button
                  type="button"
                  className={`${styles.chip} ${styles.chipButton}`}
                  onClick={() => onBuy(item)}
                  aria-label={t("markBought", { name: item.name })}
                >
                  <span className={styles.circle} aria-hidden="true" />
                  {item.name}
                  <Quantity item={item} />
                </button>
              ) : (
                <span className={`${styles.chip} ${item.pending ? styles.chipPending : ""}`}>
                  {item.name}
                  <Quantity item={item} />
                </span>
              )}
            </li>
          ))}
          {hidden > 0 ? <li className={styles.more}>{t("previewMore", { count: hidden })}</li> : null}
        </ul>
      ) : (
        <p className={styles.empty}>{t("home.empty")}</p>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      <p className={styles.status} role="status" aria-live="polite">
        {lastBought ? (
          <>
            <span>✓ {t("previewBought", { name: lastBought.name })}</span>
            <button type="button" className={styles.undo} onClick={onUndo} disabled={lastBought.pending}>
              {t("undo")}
            </button>
          </>
        ) : null}
      </p>
    </HomeSection>
  );
}

function Quantity({ item }: { item: ShoppingItem }) {
  const quantity = shownQuantity(item);
  return quantity ? <span className={styles.quantity}>{quantity}</span> : null;
}
