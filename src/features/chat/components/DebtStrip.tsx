"use client";
// La franja de arriba de «Cuentas pendientes»: lo que hay entre tú y cada persona, con sus botones.
//   · Debes:  «Debes 15,20 € a Ana» + «Le he pagado» (abre el importe; queda esperando a que Ana lo confirme).
//             Con un pago tuyo pendiente: «Esperando a Ana» + «Cancelar».
//   · Te deben: «Te debe 15,20 €» + «Me ha pagado» (vale directamente).
//             Con un pago suyo pendiente: «Dice que te ha pagado» + «Me ha llegado» / «No».
//   Si hubiera varios pagos pendientes entre los dos (pagos parciales), el primero va en la fila y el resto debajo.
// Los pagos van por la misma acción que en Gastos (paymentAction), que vuelve aquí (campo debtChat).
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useActionState, useState } from "react";
import { paymentAction } from "@/features/expenses/actions";
import { centsToInput, formatMoney } from "@/features/expenses/money";
import { initialExpensesActionState } from "@/features/expenses/types";
import type { DebtLine, DebtPayment } from "../debts";
import styles from "./Debts.module.css";

type Props = {
  conversationId: string;
  householdId: string;
  lines: DebtLine[];
  // Nombres de quienes están en la conversación
  names: Record<string, string>;
  // Eres tú quien se fue (si no, el título ya dice con quién es y la línea no repite el nombre)
  isMine: boolean;
  // Hoy en la zona horaria del hogar (fecha del pago)
  today: string;
};

export function DebtStrip({ conversationId, householdId, lines, names, isMine, today }: Props) {
  const t = useTranslations("Chat.debts");
  if (lines.length === 0) {
    return (
      <div className={styles.strip}>
        <p className={styles.nothing}>{t("nothing")}</p>
      </div>
    );
  }
  return (
    <div className={styles.strip}>
      {lines.map((line) => (
        <Line
          key={line.otherUserId}
          line={line}
          name={names[line.otherUserId] || t("someone")}
          showName={isMine}
          conversationId={conversationId}
          householdId={householdId}
          today={today}
        />
      ))}
    </div>
  );
}

type LineProps = {
  line: DebtLine;
  name: string;
  showName: boolean;
  conversationId: string;
  householdId: string;
  today: string;
};

function Line({ line, name, showName, conversationId, householdId, today }: LineProps) {
  const t = useTranslations("Chat.debts");
  const locale = useLocale();
  const [paying, setPaying] = useState(false);
  const amount = formatMoney(line.amountCents, locale);
  // El primer pago pendiente va en la misma fila; si hubiera más (pagos parciales), debajo
  const [first, ...more] = line.pending;
  const strong = (chunks: ReactNode) => (
    <strong className={line.direction === "iOwe" ? `${styles.amount} ${styles.amountOwe}` : styles.amount}>{chunks}</strong>
  );

  const text =
    line.direction === "iOwe"
      ? t.rich("iOwe", { amount, name, strong })
      : showName
        ? t.rich("owesMeNamed", { amount, name, strong })
        : t.rich("owesMe", { amount, strong });

  const hidden = (intent: string, extra: Record<string, string> = {}) => (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="debtChat" value={conversationId} />
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(extra).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );

  // Qué dice un pago pendiente y qué puedes hacer con él: si lo apuntaste tú, retirarlo; si te lo han hecho,
  // confirmarlo o decir que no te ha llegado
  const describe = (p: DebtPayment) => {
    const paid = formatMoney(p.amountCents, locale);
    const sameAmount = p.amountCents === line.amountCents;
    if (p.canCancel) return sameAmount ? t("waiting", { name }) : t("waitingAmount", { name, amount: paid });
    if (showName) return sameAmount ? t("saysPaidNamed", { name }) : t("saysPaidNamedAmount", { name, amount: paid });
    return sameAmount ? t("saysPaid") : t("saysPaidAmount", { amount: paid });
  };
  const actions = (p: DebtPayment) =>
    p.canAnswer ? (
      <div className={styles.actionsStack}>
        <ActionForm className={styles.btnTiny} label={t("received")} hidden={hidden("confirm", { paymentId: p.id })} />
        <ActionForm className={styles.btnTinySecondary} label={t("notReceived")} hidden={hidden("reject", { paymentId: p.id })} />
      </div>
    ) : p.canCancel ? (
      <div className={styles.actions}>
        <ActionForm className={styles.btnSecondary} label={t("cancelPayment")} hidden={hidden("cancel", { paymentId: p.id })} />
      </div>
    ) : null;

  return (
    <div className={styles.line}>
      <div className={styles.lineMain}>
        <p className={styles.text}>
          {text}
          {first ? <span className={styles.sub}>{describe(first)}</span> : null}
        </p>
        {first ? (
          actions(first)
        ) : !paying ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={line.direction === "iOwe" ? styles.btn : styles.btnSecondary}
              onClick={() => setPaying(true)}
            >
              {line.direction === "iOwe" ? t("iPaid") : t("theyPaid")}
            </button>
          </div>
        ) : null}
      </div>

      {more.map((p) => (
        <div key={p.id} className={styles.extra}>
          <span className={styles.sub}>{describe(p)}</span>
          {actions(p)}
        </div>
      ))}

      {paying && !first ? (
        <PayForm
          label={line.direction === "iOwe" ? t("howMuchPaid", { name }) : t("howMuchReceived", { name })}
          defaultCents={line.amountCents}
          onClose={() => setPaying(false)}
          hidden={hidden(line.direction === "iOwe" ? "paid" : "received", { otherUserId: line.otherUserId, today })}
        />
      ) : null}
    </div>
  );
}

// Un botón que manda una acción de pago (confirmar, rechazar, retirar) y enseña el error si falla
function ActionForm({ className, label, hidden }: { className: string; label: string; hidden: ReactNode }) {
  const tErrors = useTranslations("Expenses.errors");
  const [state, formAction, isPending] = useActionState(paymentAction, initialExpensesActionState);
  return (
    <form action={formAction}>
      {hidden}
      <button type="submit" className={className} disabled={isPending}>
        {label}
      </button>
      {state.error ? (
        <p className={styles.error} role="alert">
          {tErrors(state.error)}
        </p>
      ) : null}
    </form>
  );
}

// El importe del pago (se puede pagar una parte) y «Apuntar pago»
function PayForm({
  label,
  defaultCents,
  onClose,
  hidden,
}: {
  label: string;
  defaultCents: number;
  onClose: () => void;
  hidden: ReactNode;
}) {
  const t = useTranslations("Chat.debts");
  const tErrors = useTranslations("Expenses.errors");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(paymentAction, initialExpensesActionState);
  return (
    <form action={formAction} className={styles.payForm}>
      {hidden}
      <label className={styles.payLabel}>
        {label}
        <span className={styles.money}>
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={centsToInput(defaultCents, locale)}
            className={styles.moneyInput}
            required
          />
          <span aria-hidden="true">€</span>
        </span>
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.btn} disabled={isPending}>
          {t("save")}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          {t("closeForm")}
        </button>
      </div>
      {state.error ? (
        <p className={styles.error} role="alert">
          {tErrors(state.error)}
        </p>
      ) : null}
    </form>
  );
}
