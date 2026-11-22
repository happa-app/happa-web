# Tareas "cualquier día de la semana / del mes" — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que una tarea semanal o mensual pueda hacerse una vez, cualquier día del periodo, con fecha límite al final.

**Architecture:** `chores.anytime` marca estas tareas. Cada plazo es una fila de `chore_occurrences` con `due_on` = inicio
y `due_by` = fecha límite (en las de día concreto, `due_by = due_on`). Atrasada pasa a ser `due_by < hoy` en todas partes.
La lógica de fechas se duplica en SQL (manda) y en `dates.ts` (para enseñar), como ya se hace con `chore_occurs_on`/`occursOn`.

**Tech Stack:** Supabase/Postgres (plpgsql), Next.js 16 + React 19, next-intl, zod 4, test runner de Node.

**Spec:** `docs/superpowers/specs/2026-11-22-tareas-cualquier-dia-design.md`

## Global Constraints
- Rama `tareas-cualquier-dia` desde `main` actualizado. Nunca commits en `main`. **Ningún commit ni push sin el OK del usuario.**
- Interfaz y comentarios en español; claves iguales en `messages/es.json` y `messages/en.json`.
- Sin dependencias nuevas. Colores solo con variables de `tokens.css`.
- Los comentarios citan "migración 31" (la nueva) y "migración 12" (`20261004160000_tareas.sql`).
- Las funciones SQL que cambian de parámetros se **borran y se crean** (no `create or replace` con otro número de
  parámetros: crearía una segunda versión). Repetir sus `revoke`/`grant` como en la migración 12.
- `p_anytime` va **al final** de `create_chore`/`update_chore` con `default false`, para que el seed (que las llama por
  posición) siga funcionando.
- Solo `once` no cambia; `anytime` solo vale con `weekly` y `monthly`.

## Review Focus
1. Tarea creada un miércoles: el primer plazo va de miércoles a domingo (no se pierde esa semana ni empieza la siguiente).
2. Editar a mitad de semana una tarea de "lunes y jueves" a "cualquier día": aparece el plazo de esta semana (desde el lunes); y al revés, el plazo abierto pendiente desaparece.
3. "Cada 2 semanas / cada 3 meses, cualquier día": cuenta desde la semana/mes de `starts_on`.
4. Mensual en febrero: `due_by` = 28 o 29; y en diciembre → 31 (cambio de año).
5. Turnos con ausencia: se salta a alguien solo si una ausencia cubre todo el plazo; con 3 días fuera, le sigue tocando.

---

### Task 1: Migración 31 (base de datos)

**Files:**
- Create: `supabase/migrations/<timestamp>_tareas_cualquier_dia.sql` (con `npx supabase migration new tareas_cualquier_dia`)
- Modify: `supabase/seed.sql:159-167` · regenerar `src/types/database.types.ts`
- Test: script desechable en el scratchpad (`check.sql`), lanzado con psql contra la BD local (puerto 54322, usuario/clave `postgres`)

**Interfaces:**
- Produces: columnas `chores.anytime boolean not null default false` y `chore_occurrences.due_by date not null`;
  `chore_period_end(p_frequency chore_frequency, p_anytime boolean, p_day date) returns date`;
  `chore_occurs_on(p_frequency, p_interval integer, p_weekdays smallint[], p_starts date, p_day date, p_anytime boolean)`;
  RPC `create_chore(..., p_notes text default null, p_anytime boolean default false)` y `update_chore` igual.

- [ ] **Step 1: Crear la rama** `git checkout main && git pull && git checkout -b tareas-cualquier-dia`
- [ ] **Step 2: Escribir `check.sql`** con estas comprobaciones (cada una `select ... = ...` que debe dar `t`):
  - `chore_period_end('weekly', true, '2026-11-25')` = `'2026-11-29'`; `('monthly', true, '2027-02-10')` = `'2027-02-28'`;
    `('monthly', true, '2026-12-05')` = `'2026-12-31'`; `('weekly', false, '2026-11-25')` = `'2026-11-25'`.
  - `chore_occurs_on('weekly', 1, null, '2026-11-25', d, true)`: `t` el 25 (miércoles, primer día) y el lunes 30; `f` el 26 y el 29.
  - `chore_occurs_on('weekly', 2, null, '2026-11-25', '2026-11-30', true)` = `f`; con `'2026-12-07'` = `t`.
  - `chore_occurs_on('monthly', 3, null, '2026-11-15', d, true)`: `t` el 15 nov y el 1 feb; `f` el 1 dic y el 1 ene.
  - Las de días concretos dan lo mismo que antes (`'weekly', 1, array[1,4]`, `p_anytime = false`).
- [ ] **Step 3: Escribir la migración**, en este orden:
  1. Columnas: `chores.anytime`; check `chores_anytime_kind`: `not anytime or frequency in ('weekly','monthly')`;
     cambiar `chores_weekdays_valid` a `((frequency = 'weekly' and not anytime) = (weekdays is not null)) and (...igual que ahora...)`.
     `chore_occurrences.due_by`: añadir, `update ... set due_by = due_on`, `set not null`, check `due_by >= due_on`.
  2. `chore_period_end` (`immutable`): con `anytime`, semanal → domingo de esa semana; mensual → último día del mes; si no, `p_day`.
  3. `chore_occurs_on` (drop + create con `p_anytime` al final): con `anytime`, toca si `p_day >= p_starts`, es el primer
     día del periodo (lunes / día 1) **o** es `p_starts`, y el periodo cuadra con el intervalo (la misma cuenta de semanas o
     meses que ya usa). Sin `anytime`, igual que ahora.
  4. `chore_is_absent_during(p_household, p_user, p_from date, p_until date)`: hay **una** ausencia con
     `starts_on <= p_from and ends_on >= p_until`. `chore_pick_rotation` (drop + create) recibe `p_until date` y usa esta
     función en lugar de `chore_is_absent`.
  5. `chores_generate` (create or replace): para tareas `anytime`, `v_day := greatest(c.starts_on, inicio del periodo de hoy)`
     sin mirar `generated_until` (el `not exists` por `due_on` evita duplicados), para que tras editar o tras días sin abrir la
     app se cree el plazo en curso. Al insertar: `due_by = chore_period_end(c.frequency, c.anytime, v_day)` y
     `chore_pick_rotation(c.id, p_household, v_day, <ese due_by>)`.
  6. `chore_check` (drop + create con `p_anytime`): `anytime` con otra frecuencia → `'Invalid chore'`; los días de la semana
     solo se exigen en semanal sin `anytime` (con `anytime` devuelve null).
  7. `create_chore` / `update_chore` (drop + create): guardan `anytime`. En `update_chore`, el borrado de "lo que no cuadra"
     pasa a `o.due_by >= v_today` y llama a `chore_occurs_on(..., p_anytime)`.
  8. `chores_notify` (migración de avisos, create or replace): añadir `'due_by', new.due_by` a `v_data`.
  9. `revoke`/`grant` de las funciones recreadas, copiados del final de la migración 12 con las firmas nuevas.
- [ ] **Step 4: Seed**: añadir `create_chore(hogar, 'Limpiar la nevera', 2, 'weekly', 1, null, <hoy Madrid>, 'rotation', array[ana, bruno], false, null, true)`.
- [ ] **Step 5: `npx supabase db reset`** → sin errores. Lanzar `check.sql` → todo `t`. Y en SQL:
  `select due_on, due_by from chore_occurrences o join chores c on c.id = o.chore_id where c.title = 'Limpiar la nevera'` →
  primera fila `due_on` = hoy, `due_by` = el domingo. Ausencias (en `check.sql`, dentro de una transacción con `rollback`):
  ausencia de Bruno que cubre toda la semana que viene → el plazo de esa semana es de Ana; ausencia de solo 3 días → sigue siendo de Bruno.
- [ ] **Step 6: `npx supabase gen types typescript --local > src/types/database.types.ts`** y comprobar con `grep -n "p_anytime\|due_by"` que salen.
- [ ] **Step 7: Commit (con OK)** `bd: tareas de cualquier día de la semana o del mes (migración 31)`

### Task 2: Fechas y reglas en TypeScript

**Files:**
- Modify: `src/features/chores/types.ts`, `src/features/chores/dates.ts`, `src/features/chores/logic.ts`
- Create: `src/features/chores/dates.test.ts`, `src/features/chores/logic.test.ts`

**Interfaces:**
- Consumes: las reglas SQL de la Task 1 (mismos resultados).
- Produces: `Chore.anytime: boolean`; `ChoreDay.dueBy: string`; `ChoreRepeat.anytime: boolean`;
  `endOfMonth(isoDate: string): string`; `periodEnd(repeat: ChoreRepeat, day: string): string`;
  `occursOn` con `anytime`; `isOverdue` = `status === "pending" && dueBy < today`;
  `isPeriod(day: ChoreDay): boolean` (`dueBy > dueOn`); `isOpenPeriod(day: ChoreDay, today: string): boolean`
  (`isPeriod && dueOn <= today && today <= dueBy`).

- [ ] **Step 1: Tests** (`node:test` + `node:assert/strict`, como `src/features/expenses/settle.test.ts`), con los mismos
  casos que el Step 2 de la Task 1 para `periodEnd` y `occursOn`, más:
  - `endOfMonth("2028-02-03") === "2028-02-29"`.
  - `nextDates({frequency:"weekly", interval:1, weekdays:[], startsOn:"2026-11-25", anytime:true}, "2026-11-25", 3)` → `["2026-11-25","2026-11-30","2026-12-07"]`.
  - `isOverdue`: periodo 30 nov–6 dic pendiente → `false` el 6 dic, `true` el 7 dic.
  - `isOpenPeriod`: `true` el 2 dic; `false` el 29 nov; un día suelto (`dueBy === dueOn`) → `false`.
- [ ] **Step 2: `npm test`** → fallan los nuevos.
- [ ] **Step 3: Implementar** en los tres archivos (comentario: "igual que chore_occurs_on / chore_period_end, migración 31").
- [ ] **Step 4: `npm test`** → pasan todos.
- [ ] **Step 5: Commit (con OK)** `tareas: fechas y plazos de cualquier día en el cliente`

### Task 3: Leer y guardar (consultas, formulario en el servidor)

**Files:**
- Modify: `src/features/chores/queries.ts:50-90`, `src/features/chores/schemas.ts`, `src/features/chores/actions.ts:44-75`
- Create: `src/features/chores/schemas.test.ts`

**Interfaces:**
- Consumes: tipos de la Task 2; RPC con `p_anytime` (Task 1).
- Produces: `ChorePayload.anytime: boolean`; `buildChore` acepta `anytime: boolean` en la entrada; el formulario manda
  el campo `anytime` = `"on"` cuando está activo.

- [ ] **Step 1: Tests de `buildChore`**: semanal + `anytime: true` + `days: []` → `ok`, `weekdays: []`, `anytime: true`;
  `once` + `anytime: true` → `ok` con `anytime: false`; semanal sin `anytime` y sin días → `fieldErrors.days === "daysRequired"`.
- [ ] **Step 2: `npm test`** → fallan.
- [ ] **Step 3: Implementar**: `schemas.ts` (anytime solo si weekly/monthly; con él no se piden días); `queries.ts`
  (`anytime` en `CHORE_FIELDS`, `due_by` en `DAY_FIELDS`, mapear a `anytime`/`dueBy`); `actions.ts`
  (`anytime: text(formData, "anytime") === "on"` y `p_anytime: v.anytime`).
- [ ] **Step 4: `npm test`** → pasan.
- [ ] **Step 5: Commit (con OK)** `tareas: guardar y leer el plazo`

### Task 4: Formulario y frases

**Files:**
- Modify: `src/features/chores/components/ChoreForm.tsx:74-250`, `src/features/chores/describe.ts`,
  `src/features/chores/format.ts`, `messages/es.json` y `messages/en.json` (namespace `Chores`)

**Interfaces:**
- Consumes: `periodEnd`, `nextDates` con `anytime` (Task 2); campo `anytime` (Task 3).
- Produces: `formatSpan(dueOn: string, dueBy: string, locale: string): string` en `format.ts` (si son iguales,
  `formatDay`; si no, `"lun 30 nov – dom 6 dic"` con `formatDay` a cada lado); claves nuevas:
  `form.whenFixedWeek` "Días concretos" / "Specific days", `form.whenAnyWeek` "Cualquier día de la semana" / "Any day of the week",
  `form.whenFixedMonth` "Un día del mes" / "A set day", `form.whenAnyMonth` "Cualquier día del mes" / "Any day of the month",
  `schedule.weeklyAnytime` "{interval, plural, one {Cada semana} other {Cada # semanas}}, cualquier día",
  `schedule.monthlyAnytime` "{interval, plural, one {Cada mes} other {Cada # meses}}, cualquier día",
  `sections.thisWeek` "Esta semana", `sections.thisMonth` "Este mes", `row.until` "hasta el {date}" (y sus versiones en inglés).

- [ ] **Step 1: Formulario**: estado `anytime` (inicial `chore?.anytime ?? false`); en semanal y mensual, un selector de dos
  opciones con el mismo estilo `segmentOption` que la frecuencia; con `anytime` en semanal se ocultan los días; input oculto
  `anytime`. La vista previa de próximas fechas usa `formatSpan(d, periodEnd(repeat, d))`.
- [ ] **Step 2: `schedulePhrase`** devuelve `schedule.weeklyAnytime` / `schedule.monthlyAnytime` cuando `anytime`.
- [ ] **Step 3: `npm run lint`** sin errores nuevos. Comprobar que las claves nuevas están en los dos idiomas:
  `grep -c "whenAnyWeek\|weeklyAnytime\|thisWeek\|\"until\"" messages/es.json messages/en.json` → mismo número.
- [ ] **Step 4: Commit (con OK)** `tareas: elegir "cualquier día" en el formulario`

### Task 5: Dónde se ven los plazos

**Files:**
- Modify: `src/app/[locale]/(app)/hogar/[id]/tareas/page.tsx:43-107`, `components/ChoreDayRow.tsx`,
  `components/ChoreHomeRow.tsx:29-40`, `components/ChoresHome.tsx:30-40`, `components/ChoreList.tsx:40-50`,
  `components/ChoreDayDetail.tsx:59`, `src/features/notifications/text.ts:51` + `types.ts:33`

**Interfaces:**
- Consumes: `isPeriod`, `isOpenPeriod`, `isOverdue` (Task 2); `formatSpan` y claves (Task 4).

- [ ] **Step 1: Página de Tareas**: el post-it también coge tus plazos abiertos (después de atrasadas y hoy); "Hoy" solo
  días sueltos (`!isPeriod`); dos `ChoreDaySection` nuevas tras "Hoy": `sections.thisWeek` (plazos abiertos de tareas
  semanales) y `sections.thisMonth` (mensuales), sin las que esperan visto bueno. "Próximos" sin cambios de filtro.
- [ ] **Step 2: Filas**: `ChoreDayRow` y `ChoreHomeRow` añaden `row.until` con `formatDay(dueBy)` si `isPeriod`; en
  atrasadas, la fecha que se enseña es `dueBy` (`ChoreHomeRow` "desde ayer/desde el…" y `ChoreDayRow` con `showDate`).
- [ ] **Step 3: Inicio** (`ChoresHome`): detrás de las de hoy, los plazos abiertos (ordenados con `sortDays`).
- [ ] **Step 4: `ChoreList`** ("próxima"): la primera pendiente con `dueBy >= today`, con `formatSpan`. **`ChoreDayDetail`**: fecha con `formatSpan`.
- [ ] **Step 5: Avisos**: `due_by?: string` en el tipo; en `text.ts`, si hay `due_by` distinto de `due_on`, la fecha que se enseña es la de `due_by`.
- [ ] **Step 6: Comprobar**: `npm test`, `npm run lint` y `npm run build` (con `test-runner`), y a mano en `npm run dev` con
  `ana@happa.test`: "Limpiar la nevera" sale en "Esta semana" con "hasta el dom …", se marca como hecha y sale hecha; crear
  una mensual "cualquier día" y ver su frase en "Todas"; editar "Sacar la basura" a "cualquier día" y ver que sale el plazo de esta semana.
- [ ] **Step 7: Commit (con OK)** `tareas: secciones Esta semana y Este mes`
