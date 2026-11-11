"use client";
// Compra: marcar lo comprado y apuntar algo nuevo.
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import styles from "./Demo.module.css";

type Item = { id: number; name: string; qty?: number; by: "you" | "Bruno" | "Carla"; done: boolean };

// Para que la lista no crezca sin fin dentro del móvil dibujado
const MAX_ITEMS = 8;

export function ShoppingScene() {
  const t = useTranslations("Demo.shopping");
  const [items, setItems] = useState<Item[]>(() => [
    { id: 1, name: t("items.milk"), qty: 2, by: "Bruno", done: false },
    { id: 2, name: t("items.paper"), by: "Carla", done: false },
    { id: 3, name: t("items.tomatoes"), by: "you", done: true },
    { id: 4, name: t("items.coffee"), by: "Bruno", done: false },
  ]);
  const [draft, setDraft] = useState("");
  // El número del siguiente producto: un useRef guarda un valor entre pintados sin volver a pintar
  const nextId = useRef(5);

  const left = items.filter((item) => !item.done).length;
  const full = items.length >= MAX_ITEMS;

  function toggle(id: number) {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function add(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name || full) return;
    setItems((list) => [...list, { id: nextId.current++, name, by: "you", done: false }]);
    setDraft("");
  }

  return (
    <>
      <p className={styles.count} aria-live="polite">
        {t("left", { count: left })}
      </p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <label className={item.done ? `${styles.row} ${styles.rowDone}` : styles.row}>
              <input type="checkbox" className={styles.check} checked={item.done} onChange={() => toggle(item.id)} />
              <span className={styles.rowText}>
                <span className={styles.rowTitle}>
                  {item.name}
                  {item.qty ? <span className={styles.qty}> ×{item.qty}</span> : null}
                </span>
                <span className={styles.rowMeta}>
                  {item.by === "you" ? t("askedByYou") : t("askedBy", { name: item.by })}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <form className={styles.addForm} onSubmit={add}>
        <input
          className={styles.addInput}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("addPlaceholder")}
          aria-label={t("addLabel")}
          maxLength={40}
          disabled={full}
          // Es una demo: que el navegador no ofrezca guardar ni autocompletar nada
          autoComplete="off"
        />
        <button type="submit" className={styles.smallButton} disabled={full || !draft.trim()}>
          {t("add")}
        </button>
      </form>
    </>
  );
}
