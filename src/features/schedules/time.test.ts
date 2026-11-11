import { test } from "node:test";
import assert from "node:assert/strict";
import { dayPresence } from "./time.ts";

const b = (start: string, end: string, weekday = 4, userId = "me") =>
  ({ id: `${userId}${weekday}${start}`, userId, weekday, startsAt: start, endsAt: end, kind: "class", label: null }) as never;
const day = { date: "2026-11-12", weekday: 4 as const };

test("sin bloques, todo en casa", () => {
  assert.deepEqual(dayPresence("me", [], [], day), { away: false, home: [{ from: 480, to: 1440 }] });
});
test("un bloque parte el día", () => {
  assert.deepEqual(dayPresence("me", [b("09:00", "14:00")], [], day), {
    away: false,
    home: [{ from: 480, to: 540 }, { from: 840, to: 1440 }],
  });
});
test("bloques desordenados", () => {
  assert.deepEqual(dayPresence("me", [b("16:00", "18:00"), b("09:00", "14:00")], [], day), {
    away: false,
    home: [{ from: 480, to: 540 }, { from: 840, to: 960 }, { from: 1080, to: 1440 }],
  });
});
test("bloque que empieza antes de las 8", () => {
  assert.deepEqual(dayPresence("me", [b("07:00", "09:00")], [], day), { away: false, home: [{ from: 540, to: 1440 }] });
});
test("bloque entero antes de las 8", () => {
  assert.deepEqual(dayPresence("me", [b("06:00", "07:30")], [], day), { away: false, home: [{ from: 480, to: 1440 }] });
});
test("bloque hasta las 23:59", () => {
  assert.deepEqual(dayPresence("me", [b("20:00", "23:59")], [], day), {
    away: false,
    home: [{ from: 480, to: 1200 }, { from: 1439, to: 1440 }],
  });
});
test("ignora otra persona u otro día", () => {
  assert.deepEqual(dayPresence("me", [b("09:00", "14:00", 4, "otro"), b("09:00", "14:00", 5)], [], day), {
    away: false,
    home: [{ from: 480, to: 1440 }],
  });
});
test("ausencia ese día", () => {
  const abs = [{ id: "a", userId: "me", startsOn: "2026-11-10", endsOn: "2026-11-16", note: null }] as never;
  assert.deepEqual(dayPresence("me", [b("09:00", "14:00")], abs, day), { away: true });
});
test("bloques solapados se unen", () => {
  assert.deepEqual(dayPresence("me", [b("09:00", "12:00"), b("10:00", "13:00")], [], day), {
    away: false,
    home: [{ from: 480, to: 540 }, { from: 780, to: 1440 }],
  });
});
test("bloques contiguos no dejan hueco", () => {
  assert.deepEqual(dayPresence("me", [b("09:00", "12:00"), b("12:00", "14:00")], [], day), {
    away: false,
    home: [{ from: 480, to: 540 }, { from: 840, to: 1440 }],
  });
});
test("bloque que empieza justo a las 8", () => {
  assert.deepEqual(dayPresence("me", [b("08:00", "10:00")], [], day), { away: false, home: [{ from: 600, to: 1440 }] });
});
test("un bloque con hora inválida se ignora", () => {
  assert.deepEqual(dayPresence("me", [b("25:00", "26:00")], [], day), { away: false, home: [{ from: 480, to: 1440 }] });
});
