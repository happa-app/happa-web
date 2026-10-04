// Lista de gastos fijos: qué es, cada cuánto, quién paga, entre quiénes, el próximo cargo y lo que
// puede hacer cada uno (confirmar, rechazar, pausar, editar, borrar).
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatDay, recurringParticipants, recurringShareOf, recurringWaitingForMe } from "../format";
import { formatMoney } from "../money";
import type { RecurringExpense } from "../types";
import { ActionButton } from "./ActionButton";
import { RejectForm } from "./RejectForm";
import styles from "./Expenses.module.css";

type Props = {
  householdId: string;
  recurring: RecurringExpense[];
  names: Map<string, string>;
  currentUserId: string;
  // Adultos que viven ahora en el hogar
  currentIds: Set<string>;
  isCurrent: boolean;
  isAdmin: boolean;
  // Hoy en la zona horaria del hogar
  today: string;
};

export function RecurringList({
  householdId,
  recurring,
  names,
  currentUserId,
  currentIds,
  isCurrent,
  isAdmin,
  today,
}: Props) {
  const t = useTranslations("Expenses");
  const locale = useLocale();
  const realName = (id: string | null) => (id ? names.get(id) : undefined) ?? t("someone");
  // "tú" en una lista; "ti" detrás de "por"
  const byName = (id: string | null) => (id === currentUserId ? t("youObject") : realName(id));
  const inList = (ids: string[]) => ids.map((id) => (id === currentUserId ? t("you") : realName(id))).join(", ");

  if (recurring.length === 0) {
    return <p className={styles.empty}>{t("recurring.empty")}</p>;
  }

  return (
    <ul className={styles.list}>
      {recurring.map((r) => {
        const people = recurringParticipants(r);
        const missing = people.filter((id) => !r.confirmedBy.includes(id));
        const gone = r.shares.map((s) => s.userId).filter((id) => !currentIds.has(id));
        const payerGone = !currentIds.has(r.paidBy);
        // Lo que te toca en cada cargo (no se enseña si no se va a cobrar: en pausa o sin quien pague)
        const myShare = r.active && !payerGone ? recurringShareOf(r, currentUserId, currentIds) : 0;
        // Quien lo creó lo puede editar o borrar solo mientras no se haya confirmado nunca; luego, solo un admin
        const canEdit = isAdmin || (isCurrent && !r.everConfirmed && r.createdBy === currentUserId);
        // Pausar solo tiene sentido cuando ya se está cobrando
        const canPause = r.status === "confirmed" && (isAdmin || (isCurrent && r.paidBy === currentUserId));
        const fields = { householdId, recurringId: r.id, version: String(r.version) };
        const shareNames = r.shares.map((s) =>
          r.splitMethod === "shares" && s.weight
            ? `${s.userId === currentUserId ? t("you") : realName(s.userId)} (${s.weight})`
            : s.userId === currentUserId
              ? t("you")
              : realName(s.userId),
        );

        return (
          <li key={r.id} className={styles.pendingItem}>
            <p className={styles.transfer}>
              <span>{r.description}</span>
              <strong>{formatMoney(r.amountCents, locale)}</strong>
            </p>
            <p className={styles.rowMeta}>
              {t("recurring.schedule", { frequency: r.frequency, interval: r.interval })} ·{" "}
              {r.paidBy === currentUserId ? t("recurring.paidByYou") : t("recurring.paidBy", { name: realName(r.paidBy) })}
            </p>
            <p className={styles.rowMeta}>
              {t("recurring.among", { names: shareNames.join(", ") })}
              {myShare > 0 ? ` · ${t("recurring.yourShare", { amount: formatMoney(myShare, locale) })}` : null}
            </p>

            {payerGone ? (
              <p className={styles.bannerRejected}>{t("recurring.payerGone", { name: realName(r.paidBy) })}</p>
            ) : r.status === "pending" ? (
              <p className={styles.chipPending}>{t("recurring.waitingFor", { names: inList(missing) })}</p>
            ) : r.status === "rejected" ? (
              <p className={styles.bannerRejected}>
                {t("recurring.rejectedBy", { name: byName(r.rejectedBy) })}
                {r.rejectedReason ? <span className={styles.reason}>“{r.rejectedReason}”</span> : null}
              </p>
            ) : !r.active ? (
              <p className={styles.chipRejected}>{t("recurring.paused")}</p>
            ) : (
              <p className={styles.chipConfirmed}>
                {t("recurring.next", { date: formatDay(r.nextChargeOn, locale) })}
              </p>
            )}
            {!r.everConfirmed && !payerGone ? (
              <p className={styles.hint}>
                {r.startsOn <= today
                  ? t("recurring.firstChargePast", { date: formatDay(r.startsOn, locale) })
                  : t("recurring.firstCharge", { date: formatDay(r.startsOn, locale) })}
              </p>
            ) : null}
            {gone.length > 0 ? <p className={styles.hint}>{t("recurring.goneMembers", { names: inList(gone) })}</p> : null}

            {isCurrent && recurringWaitingForMe(r, currentUserId) ? (
              <div className={styles.buttonRow}>
                <ActionButton
                  kind="recurring"
                  variant="primary"
                  fields={{ ...fields, intent: "confirm" }}
                  label={t("recurring.confirm")}
                />
                <RejectForm householdId={householdId} targetId={r.id} version={r.version} kind="recurring" />
              </div>
            ) : null}

            {canEdit || canPause ? (
              <div className={styles.buttonRow}>
                {canEdit ? (
                  <ButtonLink href={`/hogar/${householdId}/gastos/fijos/${r.id}/editar`} variant="secondary">
                    {t("recurring.edit")}
                  </ButtonLink>
                ) : null}
                {canPause ? (
                  r.active ? (
                    <ActionButton
                      kind="recurring"
                      fields={{ ...fields, intent: "pause" }}
                      label={t("recurring.pause")}
                      confirmText={t("recurring.pauseConfirm", { description: r.description })}
                    />
                  ) : (
                    <ActionButton kind="recurring" fields={{ ...fields, intent: "resume" }} label={t("recurring.resume")} />
                  )
                ) : null}
                {canEdit ? (
                  <ActionButton
                    kind="recurring"
                    fields={{ ...fields, intent: "delete" }}
                    label={t("recurring.delete")}
                    confirmText={t("recurring.deleteConfirm", { description: r.description })}
                  />
                ) : null}
              </div>
            ) : null}
            {r.everConfirmed && !isAdmin && r.createdBy === currentUserId ? (
              <p className={styles.hint}>{t("recurring.adminOnly")}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
