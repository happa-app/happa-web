# Tareas "cualquier día de la semana / del mes" — diseño corto

## Qué y por qué
Hoy una tarea que se repite cae en días concretos (lunes y jueves, el día 5 de cada mes). Se quiere poder
crear tareas semanales o mensuales que se hagan **una vez, el día que se quiera, dentro del periodo**
(p. ej. "limpiar la nevera" cualquier día de la semana, "bajar el reciclaje" cualquier día del mes).

## Decidido (por el usuario)
- Solo **una vez** por periodo (nada de "X veces por semana"; se podría añadir después).
- Solo para tareas **semanales y mensuales**. Las de "una vez" (sin repetir) no cambian.
- Guardado: `due_on` sigue siendo el **inicio** del plazo y se añade la **fecha límite** (`due_by`).

## Propuesto por Claude (corregible)
- Se mantiene "cada cuántas" (cada 2 semanas, cada 3 meses...) con `interval_count`.
- **Turnos**: una persona por periodo; el siguiente periodo pasa a la siguiente.
- **Ausencias**: se salta a alguien solo si está fuera **todo** el periodo (y la recupera a la vuelta, como ahora).
- **Atrasada**: si acaba el periodo sin hacerla; sigue siendo de esa persona.
- **Dónde se ve**: en Tareas, sección propia "Esta semana" / "Este mes" con la fecha límite. En Inicio (que es
  compacto) van en la misma lista, detrás de las de hoy, con "hasta el dom 29". En "Próximos días", bajo su primer
  día con "hasta el …".
- `due_by` **obligatorio en todas las filas** (en las de día concreto, `due_by = due_on`), para que la regla
  de atrasada sea siempre la misma: `due_by < hoy`.
- Si la tarea se crea a mitad de periodo, el primer plazo empieza ese día (`due_on = max(inicio del periodo, starts_on)`).

## Approaches
- **A. `due_on` = fecha límite + `opens_on`**: lo de atrasada, orden y avisos seguirían igual. Menos cambios. No elegido.
- **B. `due_on` = inicio + `due_by`** ← **elegido por el usuario**: más fácil de leer; obliga a cambiar el cálculo
  de atrasada en SQL, TypeScript y avisos.
- Una fila por cada día del periodo: descartada (llena la BD y complica los turnos).

## Qué cambia
**Migración nueva (31)**
- `chores.anytime boolean not null default false`. Solo con `weekly`/`monthly`; semanal + `anytime` → `weekdays` null.
  Actualizar el check `chores_weekdays_valid`.
- `chore_occurrences.due_by date not null` (relleno con `due_on` en las filas que ya hay) + check `due_by >= due_on`.
- `chore_occurs_on`: con `anytime`, toca el primer día de cada periodo (lunes / día 1) según `interval_count`.
- `chores_generate`: crear el plazo del periodo en curso aunque su inicio ya haya pasado (hoy salta lo anterior a hoy);
  rellenar `due_by` (domingo / último día del mes; en el resto, `= due_on`).
- `chore_pick_rotation` / `chore_is_absent`: con plazo, ausente = ausente todos los días del plazo.
- `update_chore`: al cambiar el patrón, rehacer bien los plazos pendientes.
- Avisos (migración de avisos): incluir `due_by` y revisar el texto si dice "hoy".
- `create_chore` / `update_chore` / `chore_check`: nuevo parámetro `p_anytime`.
- Actualizar `seed.sql` con una tarea semanal "cualquier día" y regenerar `database.types.ts`.

**Código**
- `types.ts`, `queries.ts`: leer `due_by` y `anytime`; la consulta de lo atrasado mira `due_by`.
- `logic.ts` `isOverdue`: `dueBy < today`. Test con el runner de Node para el cálculo de periodos y atrasos.
- `ChoreForm` + `schemas.ts`: en semanal, "días concretos" o "cualquier día de la semana"; en mensual,
  "el día X" o "cualquier día del mes".
- Listas (`ChoreList`, `UpcomingDays`, `ChoresHome`, post-it): sección "Esta semana" / "Este mes" para los plazos
  abiertos (`due_on <= hoy <= due_by`); los próximos como "Semana del 30 nov" / "Diciembre".
- `describe.ts` / `format.ts`: describir "cualquier día de la semana" (cada N semanas / meses).
- Textos nuevos en `messages/es.json` y `messages/en.json`.

## Lo que queda para quien lo construya
- Orden exacto dentro de las secciones, y el aspecto del contador de días que quedan (si se pone).
- Detalles de nombres de columnas/parámetros, siempre en el estilo de la migración de tareas.
