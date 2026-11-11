"use client";
// Gastos: quién debe a quién y el camino de un pago (lo marca quien paga, lo confirma quien recibe).
// Las cuentas cuadran con los dos gastos de abajo: 42,60 € que pagó Bruno y 30,00 € que pagó Carla, entre
// los tres, son 24,20 € por persona. Tú no has pagado nada: debes 18,40 € a Bruno y 5,80 € a Carla.
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import styles from "./Demo.module.css";

// Lo que tarda "Bruno" en confirmar el pago
const CONFIRM_MS = 1800;

export function ExpensesScene() {
  const t = useTranslations("Demo.expenses");
  const [payment, setPayment] = useState<"pending" | "waiting" | "settled">("pending");

  // Al marcar el pago, pasado un momento Bruno lo confirma. El return limpia el temporizador si la
  // página se cierra antes (es la forma de React de "deshacer" un efecto).
  useEffect(() => {
    if (payment !== "waiting") return;
    const timer = setTimeout(() => setPayment("settled"), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [payment]);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.balance}>
          <span>{t("oweBruno")}</span>
          <strong className={payment === "settled" ? styles.owed : styles.owe}>
            {payment === "settled" ? t("zero") : t("oweBrunoAmount")}
          </strong>
        </div>
        <div className={styles.balance}>
          <span>{t("oweCarla")}</span>
          <strong className={styles.owe}>{t("oweCarlaAmount")}</strong>
        </div>
        <div aria-live="polite">
          {payment === "pending" ? (
            <button type="button" className={styles.wideButton} onClick={() => setPayment("waiting")}>
              {t("pay")}
            </button>
          ) : (
            <p className={payment === "settled" ? `${styles.status} ${styles.statusOk}` : styles.status}>
              {payment === "waiting" ? t("waiting") : t("settled")}
            </p>
          )}
        </div>
      </div>

      <h3 className={styles.subtitle}>{t("recent")}</h3>
      <ul className={styles.list}>
        <li className={styles.row}>
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{t("weekly")}</span>
            <span className={styles.rowMeta}>{t("weeklyBy")}</span>
          </span>
          <strong className={styles.amount}>{t("weeklyAmount")}</strong>
        </li>
        <li className={styles.row}>
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{t("internet")}</span>
            <span className={styles.rowMeta}>{t("internetBy")}</span>
          </span>
          <strong className={styles.amount}>{t("internetAmount")}</strong>
        </li>
      </ul>
    </>
  );
}
