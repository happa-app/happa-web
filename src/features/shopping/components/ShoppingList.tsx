"use client";
// Lista de la compra en vivo: añadir, marcar como comprado, borrar y (en la personal) pedir en casa.
import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Link } from "@/i18n/navigation";
import { useShoppingList } from "../hooks/useShoppingList";
import { MAX_QUANTITY } from "../schemas";
import { canEditItem, shownQuantity } from "../rules";
import type { ShareTarget, ShoppingItem, ShoppingScope } from "../types";
import styles from "./ShoppingList.module.css";

type Props = {
  scope: ShoppingScope;
  initialItems: ShoppingItem[];
  currentUserId: string;
  // Adultos del hogar (o tu lista personal): gestionan todo. Menores: solo lo que pidieron.
  canManageAll: boolean;
  // Solo en la lista personal: hogares a los que puedes pedir un producto
  shareTargets?: ShareTarget[];
  // Solo en la lista común, para adultos: página para pasar lo comprado a gastos
  toExpensesHref?: string;
};

export function ShoppingList({
  scope,
  initialItems,
  currentUserId,
  canManageAll,
  shareTargets = [],
  toExpensesHref,
}: Props) {
  const t = useTranslations("Shopping");
  const { items, error, dismissError, add, toggle, remove, clearChecked, share } = useShoppingList(
    scope,
    initialItems,
  );
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shareOpenFor, setShareOpenFor] = useState<string | null>(null);
  const [sharedTo, setSharedTo] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const isHousehold = scope.type === "household";
  const pendingItems = items.filter((i) => !i.checkedAt);
  const boughtItems = items
    .filter((i) => i.checkedAt)
    .sort((a, b) => (b.checkedAt ?? "").localeCompare(a.checkedAt ?? ""));

  const canEdit = (item: ShoppingItem) => canEditItem(item, currentUserId, canManageAll);
  const clearable = boughtItems.filter((i) => canEdit(i) && !i.pending);

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSharedTo(null);
    // Se vacía al momento para poder escribir el siguiente producto sin esperar.
    if (add({ name, quantity })) {
      setName("");
      setQuantity("");
      nameInput.current?.focus();
    }
  }

  async function onShare(item: ShoppingItem, target: ShareTarget) {
    setShareOpenFor(null);
    setSharedTo(target.name);
    await share(item, target.id);
  }

  function onClearBought() {
    if (window.confirm(t("clearBoughtConfirm"))) void clearChecked(clearable);
  }

  const renderItem = (item: ShoppingItem) => {
    const checked = Boolean(item.checkedAt);
    const editable = canEdit(item) && !item.pending;
    const quantity = shownQuantity(item);
    const requester =
      item.requestedBy === currentUserId ? t("you") : (item.requestedByName ?? t("someone"));

    return (
      <li key={item.id} className={`${styles.item} ${item.pending ? styles.saving : ""}`}>
        <div className={styles.row}>
          <input
            type="checkbox"
            className={styles.check}
            checked={checked}
            disabled={!editable}
            onChange={() => void toggle(item)}
            aria-label={checked ? t("markPending", { name: item.name }) : t("markBought", { name: item.name })}
          />
          <div className={styles.text}>
            <span className={checked ? styles.nameDone : styles.name}>{item.name}</span>
            {quantity || (isHousehold && item.requestedBy) ? (
              <span className={styles.meta}>
                {quantity ? <span className={styles.quantity}>{quantity}</span> : null}
                {isHousehold && item.requestedBy ? <span>{t("requestedBy", { name: requester })}</span> : null}
              </span>
            ) : null}
          </div>
          {!isHousehold && !checked && shareTargets.length > 0 && editable ? (
            <button
              type="button"
              className={styles.textButton}
              aria-expanded={shareTargets.length > 1 ? shareOpenFor === item.id : undefined}
              onClick={() =>
                shareTargets.length === 1
                  ? void onShare(item, shareTargets[0])
                  : setShareOpenFor(shareOpenFor === item.id ? null : item.id)
              }
            >
              {shareTargets.length === 1 ? t("shareTo", { name: shareTargets[0].name }) : t("share")}
            </button>
          ) : null}
          {editable ? (
            <button
              type="button"
              className={styles.remove}
              onClick={() => void remove(item)}
              aria-label={t("remove", { name: item.name })}
            >
              ×
            </button>
          ) : null}
        </div>
        {shareOpenFor === item.id ? (
          <div className={styles.shareTargets}>
            {shareTargets.map((target) => (
              <button key={target.id} type="button" className={styles.chip} onClick={() => void onShare(item, target)}>
                {t("shareTo", { name: target.name })}
              </button>
            ))}
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.addForm} onSubmit={onAdd} noValidate>
        <label className="visually-hidden" htmlFor="shopping-name">
          {t("add.name")}
        </label>
        <input
          id="shopping-name"
          ref={nameInput}
          className={styles.nameInput}
          value={name}
          maxLength={80}
          placeholder={t("add.namePlaceholder")}
          autoComplete="off"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value);
            if (error) dismissError();
          }}
        />
        <label className="visually-hidden" htmlFor="shopping-quantity">
          {t("add.quantity")}
        </label>
        <input
          id="shopping-quantity"
          className={styles.quantityInput}
          value={quantity}
          // Solo cifras, como mucho 2 (también al pegar); el teclado del móvil sale numérico.
          // Sin maxLength: el navegador cortaría lo pegado antes de quitar las letras.
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={t("add.quantityPlaceholder")}
          autoComplete="off"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setQuantity(e.target.value.replace(/\D/g, "").slice(0, String(MAX_QUANTITY).length))
          }
        />
        <button type="submit" className={styles.addButton} aria-label={t("add.submit")}>
          +
        </button>
      </form>

      {error ? <Alert tone="error">{t(`errors.${error}`)}</Alert> : null}
      <p className={styles.status} role="status" aria-live="polite">
        {sharedTo ? t("shared", { name: sharedTo }) : ""}
      </p>

      {items.length === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}

      {pendingItems.length > 0 ? (
        <section className={styles.section} aria-label={t("pending")}>
          <ul className={styles.list}>{pendingItems.map(renderItem)}</ul>
        </section>
      ) : null}

      {boughtItems.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("bought", { count: boughtItems.length })}</h2>
            <div className={styles.headerActions}>
              {toExpensesHref && boughtItems.some((i) => !i.pending) ? (
                <Link href={toExpensesHref} className={styles.textButton}>
                  {t("toExpenses")}
                </Link>
              ) : null}
              {clearable.length > 0 ? (
                <button type="button" className={styles.textButton} onClick={onClearBought}>
                  {t("clearBought")}
                </button>
              ) : null}
            </div>
          </div>
          <ul className={styles.list}>{boughtItems.map(renderItem)}</ul>
        </section>
      ) : null}
    </div>
  );
}
