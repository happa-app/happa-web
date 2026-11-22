import { test } from "node:test";
import assert from "node:assert/strict";
import { endOfMonth, nextDates, occursOn, periodEnd, type ChoreRepeat } from "./dates.ts";

const week = (over: Partial<ChoreRepeat> = {}): ChoreRepeat => ({
  frequency: "weekly",
  interval: 1,
  weekdays: [],
  startsOn: "2026-11-25",
  anytime: true,
  ...over,
});
const month = (over: Partial<ChoreRepeat> = {}): ChoreRepeat => ({
  frequency: "monthly",
  interval: 3,
  weekdays: [],
  startsOn: "2026-11-15",
  anytime: true,
  ...over,
});

test("último día del mes (también en bisiesto y en diciembre)", () => {
  assert.equal(endOfMonth("2027-02-10"), "2027-02-28");
  assert.equal(endOfMonth("2028-02-03"), "2028-02-29");
  assert.equal(endOfMonth("2026-12-05"), "2026-12-31");
});

test("fin del plazo: domingo, último del mes o el mismo día", () => {
  assert.equal(periodEnd(week(), "2026-11-25"), "2026-11-29");
  assert.equal(periodEnd(month(), "2027-02-10"), "2027-02-28");
  assert.equal(periodEnd(week({ anytime: false, weekdays: [3] }), "2026-11-25"), "2026-11-25");
});

test("semanal, cualquier día: el primer día y después cada lunes", () => {
  assert.equal(occursOn(week(), "2026-11-25"), true);
  assert.equal(occursOn(week(), "2026-11-30"), true);
  assert.equal(occursOn(week(), "2026-11-26"), false);
  assert.equal(occursOn(week(), "2026-11-29"), false);
  assert.equal(occursOn(week(), "2026-11-24"), false);
});

test("cada 2 semanas, cualquier día: cuenta desde la semana del primer día", () => {
  assert.equal(occursOn(week({ interval: 2 }), "2026-11-30"), false);
  assert.equal(occursOn(week({ interval: 2 }), "2026-12-07"), true);
});

test("cada 3 meses, cualquier día: el primer día y después el día 1", () => {
  assert.equal(occursOn(month(), "2026-11-15"), true);
  assert.equal(occursOn(month(), "2027-02-01"), true);
  assert.equal(occursOn(month(), "2026-12-01"), false);
  assert.equal(occursOn(month(), "2027-01-01"), false);
  assert.equal(occursOn(month(), "2027-02-15"), false);
});

test("días concretos: como antes", () => {
  const monThu = week({ anytime: false, weekdays: [1, 4] });
  assert.equal(occursOn(monThu, "2026-11-26"), true);
  assert.equal(occursOn(monThu, "2026-11-25"), false);
  assert.equal(occursOn(month({ anytime: false, interval: 1 }), "2026-12-15"), true);
  assert.equal(occursOn(month({ anytime: false, interval: 1 }), "2026-12-01"), false);
});

test("próximos plazos", () => {
  assert.deepEqual(nextDates(week(), "2026-11-25", 3), ["2026-11-25", "2026-11-30", "2026-12-07"]);
});
