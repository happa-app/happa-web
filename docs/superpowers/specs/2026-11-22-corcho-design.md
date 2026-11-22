# Corcho del hogar — diseño

## Qué y por qué
Un "corcho" digital por hogar con lo que hay que tener a mano en casa: el **WiFi** (con QR para conectarse
apuntando con la cámara), los **datos de pago** (Bizum o IBAN del casero o de quien adelanta las facturas) y
las **normas y notas** de la casa como post-its. Hoy esa información va por WhatsApp o pegada en la nevera.
Era un pendiente del proyecto ("caja de herramientas: QR del wifi") y de la lista del usuario («corcho digital»,
«número bizum»). Sirve para todos los tipos de hogar.

## Objetivos / no objetivos
- Objetivo: consultar y copiar el WiFi y los pagos en un toque; conectarse al WiFi con el QR; dejar avisos y normas.
- No (primera versión): documentos (contrato, inventario: archivos privados en Storage, fase 2), contactos útiles,
  notas en vivo (Realtime), avisos/push al clavar una nota, caducidad de notas, editar una nota ya clavada.
- Anti-objetivo: que los menores vean los datos de pago, o que cualquiera de fuera del hogar (casero incluido)
  vea la contraseña del WiFi o los pagos. Tampoco mandar la contraseña a servicios de terceros (el QR se genera
  en nuestro servidor).

## Decidido por el usuario
- Contenido: WiFi con QR, datos de pago, notas y normas.
- Permisos: quienes viven en el hogar ven el WiFi; **los menores no ven los pagos**; WiFi y pagos los cambian
  los adultos (`admin` y `member`). Las notas las clava cualquiera que viva en el hogar.
- Dónde: **solo en Más** → grupo del hogar → «Corcho» (encima de Configuración). El Inicio del hogar no cambia.
- Interfaz: la **mezcla** aprobada en maqueta (`.superpowers/brainstorm/…/content/corcho-mezcla-v2.html`, versión
  "Normal"): secciones con la raya gruesa (como Tareas); **WiFi y Pagos lado a lado** en dos columnas; Normas y
  Notas a todo el ancho; notas como post-its (el mismo estilo que el post-it de Tareas) en dos columnas.
- El QR se abre con el botón «QR» de la sección WiFi y sale **debajo de las dos columnas, a todo el ancho**, con
  «Apunta con la cámara del móvil para conectarte a <red>» y «Cerrar».
- Datos en **una tabla por cosa** (no una tabla genérica).
- QR con la librería **`qrcode`** (+ `@types/qrcode`), generado como SVG en el servidor.

## Approaches
- **A. Una tabla por cosa** (`household_wifi`, `household_payments`, `board_notes`) ← **elegida**: la regla
  "los menores no ven pagos" va en el RLS de `household_payments`; sigue el patrón de las demás features.
- B. Una tabla `board_items` con tipo + JSON: más flexible, pero reglas y validación mezcladas. Descartada.
- QR: `qrcode` en el servidor ← elegido. Programarlo a mano (mucho trabajo y propenso a errores) o un servicio
  externo (le daríamos la contraseña a un tercero): descartados.

## Propuesto por Claude (corregible)
- **Migración 32** con:
  - `household_wifi` (una fila por hogar, `household_id` como clave): `ssid` (1–32), `password` (0–63; vacía si es
    abierta), `security` (`wpa` | `wep` | `nopass`; `nopass` ⇒ sin contraseña), `updated_by`, `updated_at`.
  - `household_payments`: `label` (1–40, p. ej. «Casero», «Luz y agua»), `kind` (`bizum` | `iban`), `value`
    (Bizum: teléfono de 9 cifras españolas, guardado sin espacios; IBAN: sin espacios, en mayúsculas, con la
    comprobación de dígitos de control mod 97), `position` para el orden, `created_by`. Máximo 10 por hogar.
  - `board_notes`: `body` (1–200), `pinned` (norma o no), `author_id`, `created_at`. Máximo 50 por hogar.
  - RLS activado y solo lectura desde la app: `household_wifi` y `board_notes` → `is_household_resident`;
    `household_payments` → `is_household_adult` (los menores no los leen). Escrituras solo por funciones SQL
    `security definer`: `set_household_wifi`, `delete_household_wifi`, `add_household_payment`,
    `delete_household_payment`, `add_board_note(p_household, p_body, p_pinned)`, `set_board_note_pinned`,
    `delete_board_note`. Reglas: WiFi y pagos, solo adultos; clavar nota, cualquiera que viva en el hogar, pero
    `pinned = true` solo un adulto; fijar o desfijar, solo adultos; quitar una nota, quien la puso o un admin.
  - Todo se borra en cascada con el hogar. Quien se va del hogar deja de verlo (ya no es residente); sus notas se quedan.
- **Feature** `src/features/board/` con el patrón de siempre (`queries.ts`, `actions.ts`, `schemas.ts`,
  `errors.ts`, `components/`), sin Realtime.
- **Páginas**: `/hogar/[id]/corcho` (con `loading.tsx`), `/hogar/[id]/corcho/wifi` (editar o quitar el WiFi) y
  `/hogar/[id]/corcho/pago` (añadir un pago). Clavar una nota es un formulario corto en la misma página, plegado
  tras el botón «Clavar una nota»; la casilla «Es una norma (se queda fijada arriba)» solo la ven los adultos.
  Cada pago y cada nota que puedes quitar lleva «Quitar» (con confirmación).
- **Menores**: no ven la columna Pagos; el WiFi ocupa entonces todo el ancho.
- **Contraseña del WiFi**: se ve con puntos; tocar los puntos la enseña (no hay botón «Ver» aparte); «Copiar» la copia.
- **IBAN** largo: se enseña recortado («ES12 …5678»); «Copiar» copia el número entero.
- **Sin editar**: los pagos y las notas se añaden y se quitan, no se editan (para cambiar uno, se quita y se añade).
- La contraseña del WiFi se guarda tal cual (hace falta para enseñarla y para el QR), protegida por RLS.
- **Vacío**: «Aún no está el WiFi» / «Aún no hay datos de pago» / «No hay notas»; con botón para añadir si puedes.
- **QR**: texto `WIFI:T:<WPA|WEP|nopass>;S:<red>;P:<clave>;;` escapando `\ ; , : "` con `\`. Se genera en el
  servidor al pintar la página y se pasa como SVG a un componente cliente que lo despliega/pliega.
- **Textos** en es y en (namespace `Board`); colores solo con variables de `tokens.css`.
- **Privacidad**: son datos nuevos (contraseña del WiFi; Bizum/IBAN que pueden ser de terceros, p. ej. el casero).
  Revisar si la política de privacidad debe mencionarlos (los guarda el hogar, los ven solo sus adultos).

## Lo que queda para quien lo construya
- Iconos y detalles finos de espaciado, siguiendo la maqueta aprobada.
- Mensajes de error concretos y sus claves (`errors.ts`), con el estilo de las otras features.
- Orden dentro de Notas (lo propuesto: más recientes primero) y de Normas (por fecha de creación).
