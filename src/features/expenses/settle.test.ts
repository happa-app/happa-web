import { test } from "node:test";
import assert from "node:assert/strict";
import { myBalanceBars } from "./settle.ts";

test("ordena, escala al mayor y separa el sentido", () => {
  const t = [
    { from: "b", to: "me", amountCents: 1420 },
    { from: "me", to: "c", amountCents: 580 },
    { from: "d", to: "me", amountCents: 1500 },
  ];
  assert.deepEqual(myBalanceBars(t, "me"), [
    { userId: "d", amountCents: 1500, owesMe: true, widthPct: 100 },
    { userId: "b", amountCents: 1420, owesMe: true, widthPct: 95 },
    { userId: "c", amountCents: 580, owesMe: false, widthPct: 39 },
  ]);
});
test("ignora los pagos entre otros", () => {
  assert.deepEqual(myBalanceBars([{ from: "b", to: "c", amountCents: 900 }], "me"), []);
});
test("una deuda diminuta sigue viéndose", () => {
  const bars = myBalanceBars([{ from: "b", to: "me", amountCents: 10000 }, { from: "me", to: "c", amountCents: 50 }], "me");
  assert.equal(bars[1].widthPct, 4);
});
test("sin transferencias, no hay barras", () => {
  assert.deepEqual(myBalanceBars([], "me"), []);
});
test("una sola deuda ocupa todo el ancho", () => {
  assert.deepEqual(myBalanceBars([{ from: "b", to: "me", amountCents: 700 }], "me"), [
    { userId: "b", amountCents: 700, owesMe: true, widthPct: 100 },
  ]);
});
