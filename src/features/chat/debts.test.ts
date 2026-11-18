import { test } from "node:test";
import assert from "node:assert/strict";
import { debtLines, type DebtPayment } from "./debts.ts";

const brunoToAna = [{ from: "bruno", to: "ana", amountCents: 1520 }];

test("quien se fue ve lo que debe", () => {
  assert.deepEqual(debtLines(brunoToAna, [], "bruno"), [
    { otherUserId: "ana", direction: "iOwe", amountCents: 1520, pending: [] },
  ]);
});

test("la otra parte ve lo que le deben", () => {
  assert.deepEqual(debtLines(brunoToAna, [], "ana"), [
    { otherUserId: "bruno", direction: "owesMe", amountCents: 1520, pending: [] },
  ]);
});

test("quien no está en ningún pago no tiene líneas", () => {
  assert.deepEqual(debtLines(brunoToAna, [], "carla"), []);
});

test("lleva los pagos pendientes entre los dos, en cualquier sentido, y no los de otros", () => {
  const payment: DebtPayment = { id: "p1", fromUserId: "bruno", toUserId: "ana", amountCents: 1000, canAnswer: true, canCancel: false };
  const back: DebtPayment = { id: "p3", fromUserId: "ana", toUserId: "bruno", amountCents: 100, canAnswer: false, canCancel: true };
  const other: DebtPayment = { id: "p2", fromUserId: "carla", toUserId: "ana", amountCents: 500, canAnswer: true, canCancel: false };
  assert.deepEqual(debtLines(brunoToAna, [payment, other, back], "ana")[0].pending.map((p) => p.id), ["p1", "p3"]);
  assert.deepEqual(debtLines(brunoToAna, [payment, other, back], "bruno")[0].pending.map((p) => p.id), ["p1", "p3"]);
});

test("ignora los pagos de cero", () => {
  assert.deepEqual(debtLines([{ from: "bruno", to: "ana", amountCents: 0 }], [], "bruno"), []);
});
