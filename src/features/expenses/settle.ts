// Ajuste automático: con los saldos de cada uno, propone las transferencias para quedar en paz.
// Quien más debe paga a quien más le deben, y así hasta cuadrar. Salen como mucho (personas − 1)
// transferencias. Es solo una sugerencia: lo que cuenta son los pagos que se apuntan y se confirman.
import type { BalanceBar, NetBar, Transfer } from "./types";

export function suggestTransfers(people: { userId: string; netCents: number }[]): Transfer[] {
  const byId = (a: { userId: string }, b: { userId: string }) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0);
  const creditors = people
    .filter((p) => p.netCents > 0)
    .map((p) => ({ userId: p.userId, left: p.netCents }))
    .sort((a, b) => b.left - a.left || byId(a, b));
  const debtors = people
    .filter((p) => p.netCents < 0)
    .map((p) => ({ userId: p.userId, left: -p.netCents }))
    .sort((a, b) => b.left - a.left || byId(a, b));

  const transfers: Transfer[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].left, debtors[d].left);
    if (amount > 0) transfers.push({ from: debtors[d].userId, to: creditors[c].userId, amountCents: amount });
    creditors[c].left -= amount;
    debtors[d].left -= amount;
    if (creditors[c].left === 0) c += 1;
    if (debtors[d].left === 0) d += 1;
  }
  return transfers;
}

// La balanza de Inicio: solo los pagos en los que estás tú. Primero quien te debe y luego a quien
// debes, cada grupo de mayor a menor. La longitud es proporcional al mayor importe (mínimo 4 % para que se vea).
export function myBalanceBars(transfers: Transfer[], me: string): BalanceBar[] {
  const mine = transfers.filter((tr) => tr.from === me || tr.to === me);
  const largest = Math.max(0, ...mine.map((tr) => tr.amountCents));
  return mine
    .map((tr) => {
      const owesMe = tr.to === me;
      return {
        userId: owesMe ? tr.from : tr.to,
        amountCents: tr.amountCents,
        owesMe,
        widthPct: Math.max(4, Math.round((tr.amountCents / largest) * 100)),
      };
    })
    .sort((a, b) => Number(b.owesMe) - Number(a.owesMe) || b.amountCents - a.amountCents);
}

// La balanza de todo el piso: el saldo neto de cada uno, en el mismo orden que llega. La longitud es
// proporcional al mayor saldo (en valor absoluto), con mínimo 4 % para los saldos pequeños; quien está a cero no tiene barra.
export function netBars(people: { userId: string; netCents: number }[]): NetBar[] {
  const largest = Math.max(0, ...people.map((p) => Math.abs(p.netCents)));
  return people.map((p) => ({
    userId: p.userId,
    netCents: p.netCents,
    widthPct: p.netCents === 0 ? 0 : Math.max(4, Math.round((Math.abs(p.netCents) / largest) * 100)),
  }));
}
