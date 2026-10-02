// Ajuste automático: con los saldos de cada uno, propone las transferencias para quedar en paz.
// Quien más debe paga a quien más le deben, y así hasta cuadrar. Salen como mucho (personas − 1)
// transferencias. Es solo una sugerencia: lo que cuenta son los pagos que se apuntan y se confirman.
import type { Transfer } from "./types";

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
