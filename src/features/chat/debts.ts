// «Cuentas pendientes» (migración 29): qué hay entre tú y cada persona de la conversación, sin React.
//
// Ejemplo: Bruno se fue del piso debiendo 15,20 € y a Ana el piso le debe 30,40 €. Con el ajuste automático de
// Gastos (suggestTransfers, que calcula quien llama a estas funciones) sale «Bruno → Ana · 15,20 €». Bruno ve
// «Debes 15,20 € a Ana» y Ana, «Bruno te debe 15,20 €».

// Un pago sugerido entre dos personas (el mismo tipo que Transfer de Gastos)
type Transfer = { from: string; to: string; amountCents: number };

// Un pago apuntado que aún espera respuesta
export type DebtPayment = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  // Lo puedes confirmar o rechazar tú (eres quien lo recibe)
  canAnswer: boolean;
  // Lo puedes retirar tú (lo apuntaste tú)
  canCancel: boolean;
};

// Lo que hay entre tú y otra persona de la conversación
export type DebtLine = {
  otherUserId: string;
  // iOwe: le debes tú · owesMe: te debe
  direction: "iOwe" | "owesMe";
  amountCents: number;
  // Los pagos entre los dos que esperan respuesta (normalmente ninguno o uno; el más reciente primero)
  pending: DebtPayment[];
};

// Tus líneas: solo los pagos sugeridos en los que estás tú, con los pagos pendientes entre los dos
export function debtLines(transfers: Transfer[], payments: DebtPayment[], me: string): DebtLine[] {
  return transfers
    .filter((t) => t.amountCents > 0 && (t.from === me || t.to === me))
    .map((t) => {
      const other = t.from === me ? t.to : t.from;
      const pending = payments.filter(
        (p) => (p.fromUserId === me && p.toUserId === other) || (p.fromUserId === other && p.toUserId === me),
      );
      return { otherUserId: other, direction: t.from === me ? "iOwe" : "owesMe", amountCents: t.amountCents, pending };
    });
}
