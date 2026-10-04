// Detalle de un gasto: quién pagó, cuánto le toca a cada uno, quién lo ha confirmado y qué puedes hacer.
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { formatDay, participantsOf, waitingForMe } from "../format";
import { formatMoney } from "../money";
import type { Expense } from "../types";
import { ActionButton } from "./ActionButton";
import { RejectForm } from "./RejectForm";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  expense: Expense;
  names: Map<string, string>;
  currentUserId: string;
  // Sigues viviendo en el hogar (quien se fue con deudas solo puede confirmar, rechazar y pagar)
  isCurrent: boolean;
  isAdmin: boolean;
};

export function ExpenseDetail({ householdId, expense: e, names, currentUserId, isCurrent, isAdmin }: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const realName = (id: string | null) => (id ? names.get(id) : undefined) ?? t("someone");
  // "Tú" al principio de una fila; "ti" detrás de "por" ("añadido por ti")
  const name = (id: string | null) => (id === currentUserId ? t("youCap") : realName(id));
  const byName = (id: string | null) => (id === currentUserId ? t("youObject") : realName(id));
  const inList = (ids: string[]) => ids.map((id) => (id === currentUserId ? t("you") : realName(id))).join(", ");

  const people = participantsOf(e);
  const missing = people.filter((id) => !e.confirmedBy.includes(id));
  const canEdit = isAdmin || (isCurrent && e.status !== "confirmed" && e.createdBy === currentUserId);
  const fields = { householdId, expenseId: e.id, version: String(e.version) };

  return (
    <>
      <section className={styles.detailHead}>
        <p className={styles.detailAmount}>{formatMoney(e.amountCents, locale)}</p>
        <p className={styles.muted}>
          {formatDay(e.spentOn, locale)} ·{" "}
          {e.source === "recurring"
            ? t("detail.recurringCharge")
            : e.source === "shopping"
              ? t("detail.fromShopping", { name: byName(e.createdBy) })
              : t("detail.createdBy", { name: byName(e.createdBy) })}
        </p>
        {e.status === "pending" ? (
          <p className={styles.bannerPending}>{t("detail.pendingBanner", { names: inList(missing) })}</p>
        ) : e.status === "rejected" ? (
          <p className={styles.bannerRejected}>
            {t("detail.rejectedBanner", { name: byName(e.rejectedBy) })}
            {e.rejectedReason ? <span className={styles.reason}>“{e.rejectedReason}”</span> : null}
          </p>
        ) : (
          <p className={styles.bannerConfirmed}>{t("detail.confirmedBanner")}</p>
        )}
      </section>

      {waitingForMe(e, currentUserId) ? (
        <div className={styles.buttonRow}>
          <ActionButton kind="expense" variant="primary" fields={{ ...fields, intent: "confirm" }} label={t("detail.confirm")} />
          <RejectForm householdId={householdId} targetId={e.id} version={e.version} />
        </div>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{e.payers.length === 1 ? t("detail.paidOne") : t("detail.paidMany")}</h2>
        <ul className={styles.list}>
          {e.payers.map((p) => (
            <li key={p.userId} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{name(p.userId)}</span>
              </span>
              <span className={styles.rowAmount}>{formatMoney(p.amountCents, locale)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t("detail.split")} · {t(`methods.${e.splitMethod}`)}
        </h2>
        <ul className={styles.list}>
          {e.shares.map((s) => (
            <li key={s.userId} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{name(s.userId)}</span>
                {s.weight ? <span className={styles.rowMeta}>{t("detail.parts", { count: s.weight })}</span> : null}
              </span>
              <span className={styles.rowRight}>
                <span className={styles.rowAmount}>{formatMoney(s.amountCents, locale)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {e.items.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("detail.items", { count: e.items.length })}</h2>
          <ul className={styles.list}>
            {e.items.map((item, index) => (
              <li key={index} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{item.name}</span>
                </span>
                {item.quantity > 1 ? <span className={styles.muted}>×{item.quantity}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("detail.confirmations")}</h2>
        <ul className={styles.list}>
          {people.map((id) => (
            <li key={id} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{name(id)}</span>
              </span>
              {e.confirmedBy.includes(id) ? (
                <span className={styles.chipConfirmed}>{t("detail.confirmedBy")}</span>
              ) : e.status === "rejected" && e.rejectedBy === id ? (
                <span className={styles.chipRejected}>{t("status.rejected")}</span>
              ) : (
                <span className={styles.chipPending}>{t("detail.waiting")}</span>
              )}
            </li>
          ))}
        </ul>
        {e.status === "confirmed" && missing.length > 0 ? <p className={styles.hint}>{t("detail.confirmedByAdmin")}</p> : null}
        {e.source === "recurring" ? (
          <p className={styles.hint}>
            {t("detail.recurringHint")}{" "}
            {e.recurringId ? (
              <Link href={`/hogar/${householdId}/gastos/fijos`} className={styles.textLink}>
                {t("detail.recurringLink")}
              </Link>
            ) : null}
          </p>
        ) : null}
      </section>

      {canEdit || (isAdmin && e.status === "pending") ? (
        <div className={styles.manage}>
          {canEdit ? (
            <ButtonLink href={`/hogar/${householdId}/gastos/${e.id}/editar`} variant="secondary" fullWidth>
              {t("detail.edit")}
            </ButtonLink>
          ) : null}
          {isAdmin && e.status === "pending" ? (
            <ActionButton
              kind="expense"
              fields={{ ...fields, intent: "forceConfirm" }}
              label={t("detail.forceConfirm")}
              confirmText={t("detail.forceConfirmText", { names: inList(missing) })}
              fullWidth
            />
          ) : null}
          {canEdit ? (
            <ActionButton
              kind="expense"
              fields={{ ...fields, intent: "delete" }}
              label={t("detail.delete")}
              confirmText={t("detail.deleteConfirm", { description: e.description })}
              fullWidth
            />
          ) : null}
          {e.status === "confirmed" ? <p className={styles.hint}>{t("detail.adminOnly")}</p> : null}
        </div>
      ) : e.status === "confirmed" ? (
        <p className={styles.hint}>{t("detail.adminOnly")}</p>
      ) : null}
    </>
  );
}
