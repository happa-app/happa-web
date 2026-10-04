// Reparto de un gasto: la misma cuenta que hace la base de datos (triqui_split, migración 8).
// Aquí solo sirve para enseñar lo que le toca a cada uno mientras se rellena el formulario;
// lo que vale es lo que calcula la base de datos al guardar.
import type { SplitMethod } from "./types";

export type ShareInput = { userId: string; weight?: number; amountCents?: number };

// Devuelve los céntimos de cada persona, en el mismo orden que la entrada.
// Iguales y por partes: en proporción; los céntimos que sobran van a quien tiene la parte decimal
// más grande y, si empatan, en orden de id (como la base de datos). Así cuadra al céntimo.
export function splitAmount(totalCents: number, method: SplitMethod, shares: ShareInput[]): number[] {
  if (shares.length === 0) return [];
  if (method === "exact") return shares.map((s) => s.amountCents ?? 0);

  const weights = shares.map((s) => (method === "shares" ? (s.weight ?? 0) : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return shares.map(() => 0);

  const base = weights.map((w) => Math.floor((totalCents * w) / totalWeight));
  const remainders = weights.map((w) => (totalCents * w) % totalWeight);
  let leftover = totalCents - base.reduce((a, b) => a + b, 0);

  const order = shares
    .map((s, i) => i)
    .sort((a, b) => remainders[b] - remainders[a] || compareIds(shares[a].userId, shares[b].userId));
  for (const i of order) {
    if (leftover <= 0) break;
    base[i] += 1;
    leftover -= 1;
  }
  return base;
}

// Mismo orden que los uuid en PostgreSQL (en minúsculas, compararlos como texto da el mismo resultado)
function compareIds(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}
