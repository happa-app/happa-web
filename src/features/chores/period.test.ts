import { test } from "node:test";
import assert from "node:assert/strict";
import { allowsAnytime, isOpenPeriod, isOverdue, isPeriod } from "./period.ts";
import type { ChoreDay } from "./types.ts";

const day = (dueOn: string, dueBy: string, status: ChoreDay["status"] = "pending"): ChoreDay => ({
  id: "o1",
  choreId: "c1",
  dueOn,
  dueBy,
  assigneeId: null,
  status,
  doneBy: null,
  doneAt: null,
  approvedBy: null,
  approvedAt: null,
  reopenedBy: null,
  reopenedAt: null,
  manual: false,
});

const semana = day("2026-11-30", "2026-12-06");

test("un plazo pendiente está atrasado cuando pasa la fecha límite, no antes", () => {
  assert.equal(isOverdue(semana, "2026-12-06"), false);
  assert.equal(isOverdue(semana, "2026-12-07"), true);
  assert.equal(isOverdue(day("2026-11-30", "2026-12-06", "done"), "2026-12-07"), false);
});

test("un día suelto está atrasado al día siguiente", () => {
  assert.equal(isOverdue(day("2026-11-30", "2026-11-30"), "2026-11-30"), false);
  assert.equal(isOverdue(day("2026-11-30", "2026-11-30"), "2026-12-01"), true);
});

test("plazo abierto: entre el primer día y la fecha límite", () => {
  assert.equal(isPeriod(semana), true);
  assert.equal(isOpenPeriod(semana, "2026-12-02"), true);
  assert.equal(isOpenPeriod(semana, "2026-11-29"), false);
  assert.equal(isOpenPeriod(semana, "2026-12-07"), false);
  assert.equal(isPeriod(day("2026-11-30", "2026-11-30")), false);
  assert.equal(isOpenPeriod(day("2026-11-30", "2026-11-30"), "2026-11-30"), false);
});

test("cualquier día solo vale en semanal y mensual", () => {
  assert.equal(allowsAnytime("weekly"), true);
  assert.equal(allowsAnytime("monthly"), true);
  assert.equal(allowsAnytime("daily"), false);
  assert.equal(allowsAnytime("once"), false);
});
