# Privacidad y consentimientos de HAPPA — diseño

Fecha: 20 de octubre de 2026 · Estado: **aprobado con los ajustes de la revisión (versión 2)** · Rama: `privacidad`

## 1. Resumen

Antes de abrir HAPPA al público hace falta la **política de privacidad** (ahora la página solo dice "en preparación") y una forma **legal** de poder, en el futuro, ceder datos de los usuarios a otras empresas como fuente de ingresos.

Se hace como lo hacen las grandes empresas en España (portales, bancos, apps de reparto):

1. **Primera capa en el registro:** una tabla corta de "Información básica sobre protección de datos", el formato que recomienda la AEPD.
2. **Dos casillas opcionales, separadas y desmarcadas:** novedades de HAPPA y ofertas de empresas colaboradoras.
3. **Centro de privacidad en el perfil:** interruptores para cambiar esas decisiones cuando se quiera.
4. **Registro de cada decisión** con fecha, versión del texto y origen, como prueba.
5. **Segunda capa:** la política de privacidad completa, en español e inglés.

**Por qué así y no "al aceptar los términos aceptas la venta":** el RGPD (art. 7.4) dice que el consentimiento no es válido si se exige para usar el servicio. Una cesión aceptada así se podría multar y, además, un comprador no le daría valor a esos datos porque no estarían bien consentidos. Con una casilla aparte, los datos de quien sí acepta tienen prueba y, por tanto, valor.

### Cambios de la revisión (versión 2)

- Datos del titular desde variables de entorno, no escritos en el repositorio (público).
- Código postal del hogar (opcional) y más sectores en la cesión a colaboradores.
- Zoho Mail como proveedor (buzones @happa.es).
- Distinción entre la cesión publicitaria (consentimiento) y las solicitudes a profesionales del directorio (contrato).
- Conservación bloqueada 3 años de la prueba de consentimientos tras borrar la cuenta, con borrado automático después.

## 2. Qué verá cada persona

### 2.1 Al registrarse

Debajo de las dos casillas obligatorias que ya existen ("Acepto los términos y la política de privacidad" y "Soy mayor de edad"):

Formato **por capas** y compacto, como las grandes empresas (la versión anterior, con todo el texto a la vista, resultaba agobiante):

**Dos casillas opcionales, desmarcadas, de una línea** (versión de texto `v3`):

- ☐ *Quiero recibir por correo novedades y ventajas de HAPPA*
- ☐ *Quiero recibir ofertas para mi hogar de empresas colaboradoras* — debajo, plegado, **"Qué se comparte"**: *"Para que te envíen sus ofertas, les pasaríamos tu nombre, tu correo, tu idioma, tu código postal y el tipo y tamaño de tu hogar. Solo a empresas de servicios para el hogar, mudanzas, mobiliario, seguros, servicios financieros o de gestión de alquiler y suministros (luz, gas o internet). Nunca tu dirección, tus mensajes ni tus gastos. Puedes quitarlo cuando quieras en Perfil → Privacidad."*

**Separadas** porque el RGPD pide consentimiento granular (una casilla por finalidad; Directrices 05/2020 del CEPD): así la prueba de consentimiento de la cesión es sólida. Se probó una sola casilla para las dos (versión `v2`) y se descartó por ese riesgo.

**Pensadas para que se acepten, sin patrones oscuros** (Directrices 03/2022 del CEPD: nada premarcado, ni textos confusos, ni insistir, ni esconder el "no"):

1. Frases cortas, en primera persona y con lo que gana la persona ("ofertas para mi hogar", no "ceder mis datos").
2. Primero la más fácil de aceptar (novedades de HAPPA): tras un "sí", el siguiente cuesta menos.
3. El detalle a un clic, claro y tranquilizador ("nunca tu dirección, tus mensajes ni tus gastos", "puedes quitarlo cuando quieras").
4. Sin prometer lo que no se sabe si habrá (por ejemplo, "descuentos").

Respecto al texto de la revisión, se ha añadido "servicios financieros", porque la revisión pedía ese sector y la casilla tiene que cubrir todos. **A confirmar por el socio.**

**Bajo el botón "Crear cuenta", plegado y en letra pequeña: "Información básica sobre protección de datos":**

| | |
|---|---|
| Responsable | El titular de HAPPA · privacidad@happa.es |
| Finalidad | Darte el servicio de HAPPA. Si lo eliges arriba: enviarte novedades de HAPPA y ceder tus datos a empresas colaboradoras. |
| Legitimación | El contrato (los términos de uso) y, para lo opcional, tu consentimiento. |
| Destinatarios | Proveedores que nos dan el servicio (alojamiento, correo). Empresas colaboradoras, solo si lo aceptas. |
| Derechos | Acceder, corregir, borrar, oponerte, limitar, llevarte tus datos y retirar tu consentimiento. |
| Más información | En la política de privacidad (enlace). |

Se puede registrar igual sin marcar las casillas opcionales.

### 2.2 En el perfil: Perfil → Privacidad (pantalla nueva)

- Los **dos interruptores**, con las mismas frases cortas y el mismo "Qué se comparte" plegado. Cambian al momento y se ve la fecha del último cambio.
- Enlace a la política de privacidad.
- **Tus derechos:** cómo pedir una copia de tus datos o ejercer cualquier derecho (correo a privacidad@happa.es) y el botón de **borrar la cuenta** que ya existe.

### 2.3 Usuarios que ya están registrados

No se les pide nada. En su perfil verán las dos opciones **desactivadas** y podrán activarlas si quieren.

### 2.4 Código postal del hogar (nuevo, opcional)

- Campo opcional **"Código postal"** al crear un hogar y en Más → Configuración (lo cambia el admin).
- Se explica para qué: *"Para mostrarte profesionales y servicios cerca de casa."* Esa es su finalidad (servicio). No hace falta casilla propia: se rellena si se quiere.
- Solo se guarda el código postal (5 cifras), **nunca la dirección exacta**.
- Solo se cede a colaboradores si la persona ha aceptado la segunda casilla.

## 3. Qué se comparte y qué no con empresas colaboradoras

Solo de quien tenga activada la segunda casilla:

- **Sí:** nombre, correo, idioma, tipo de hogar (piso de estudiantes, compartido, pareja, familia), número de personas del hogar y su código postal (si se ha indicado).
- **Nunca:** la dirección exacta, el chat, los gastos, los horarios, las ausencias, las tareas, la lista de la compra, la foto ni los datos de otras personas del hogar.
- **Nunca de menores.**

## 4. La política de privacidad completa

En `/legal/privacidad`, con el mismo formato que los términos (resumen arriba, índice y apartados), en español e inglés. Apartados:

1. **Responsable:** datos del titular (los mismos que en los términos, desde variables de entorno) y privacidad@happa.es.
2. **Qué datos tratamos:** cuenta (correo, contraseña cifrada), perfil (nombre, foto, idioma, zona horaria), hogares y personas (con el código postal, si se indica), lista de la compra, gastos y pagos, tareas, horarios y ausencias, chat, ruleta, avisos y suscripciones del móvil, consentimientos, y datos técnicos (cookies de sesión, registros del servidor).
3. **Para qué y con qué base legal:**
   - Dar el servicio, incluido mostrar profesionales y servicios cerca: contrato (art. 6.1.b RGPD).
   - Seguridad y prevención de abusos: interés legítimo (art. 6.1.f).
   - Comunicaciones de HAPPA: consentimiento (art. 6.1.a).
   - Cesión a empresas colaboradoras para sus ofertas: consentimiento (art. 6.1.a), casilla opcional.
   - **Solicitudes a profesionales del directorio** (cuando exista): si pides un presupuesto o una reparación a un profesional (fontanero, electricista…), le pasamos tus datos de contacto para atender tu petición. Base: ejecución de un contrato o medidas precontractuales a petición tuya (art. 6.1.b), **tanto si marcaste la casilla publicitaria como si no**.
   - Estadísticas anonimizadas: no son datos personales.
   - Cumplir la ley: obligación legal (art. 6.1.c).
4. **Cuánto tiempo:** mientras tengas cuenta. Al borrarla, el perfil se anonimiza al momento y desapareces de tus hogares. Los registros de tus consentimientos se conservan **debidamente bloqueados** (art. 32 LOPDGDD) **3 años**, únicamente para atender posibles responsabilidades legales y requerimientos de la AEPD o de jueces y tribunales; después se borran.
5. **Proveedores (encargados del tratamiento):** Supabase (base de datos, cuentas y fotos; servidores en Fráncfort, UE), Vercel (servidor de la web; funciones en Fráncfort), Resend (envío de correos de la app), Zoho Corporation (Zoho Mail: buzones @happa.es, servidores en la UE) y los servicios de avisos al móvil de Google, Apple y Mozilla (según tu móvil).
6. **Cesión a empresas colaboradoras:** solo con tu consentimiento, solo los datos del punto 3 de este documento (nunca la dirección exacta) y solo a los sectores indicados: servicios para el hogar, mudanzas, mobiliario y equipamiento del hogar, seguros, servicios financieros o de gestión de alquiler y suministros (luz, gas, internet). La empresa que los reciba será responsable de ellos y te informará. Puedes retirar el consentimiento cuando quieras; no afecta a las cesiones ya hechas.
7. **Si HAPPA se vende o se fusiona:** tus datos pasarían a la nueva empresa para seguir dándote el servicio. Te avisaríamos antes y podrías borrar tu cuenta.
8. **Datos anonimizados:** HAPPA puede elaborar y compartir estadísticas que no permiten identificar a nadie (por ejemplo, gasto medio por tipo de hogar).
9. **Transferencias fuera de la UE:** algunos proveedores son empresas de EE. UU. Se hacen con las garantías del RGPD (Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo).
10. **Menores:** para tener cuenta hay que ser mayor de edad. Las cuentas de menor solo las crea y gestiona su madre, padre o tutor. Nunca se ceden datos de menores.
11. **Tus derechos:** acceso, rectificación, supresión, oposición, limitación, portabilidad y retirar el consentimiento, escribiendo a privacidad@happa.es. Si no te atendemos bien, puedes reclamar a la AEPD (aepd.es).
12. **Seguridad:** conexión cifrada, contraseñas cifradas, cada persona solo puede ver lo de sus hogares (reglas en la propia base de datos) y acceso de administración restringido.
13. **Cookies:** solo técnicas y necesarias (sesión `sb-…`, idioma `NEXT_LOCALE`, último hogar abierto `happa_hogar`). No hay analítica ni publicidad, por eso no hay banner de cookies.
14. **Cambios en esta política:** se avisa dentro de la app y por correo si el cambio es importante.

La versión pasa de `borrador-1` a `v1-2026-10-20`.

## 5. Decisiones

Resueltas en la revisión:

1. **Datos del titular:** desde variables de entorno (`NEXT_PUBLIC_LEGAL_OWNER_NAME`, `NEXT_PUBLIC_LEGAL_OWNER_NIF`, `NEXT_PUBLIC_LEGAL_OWNER_ADDRESS`), configuradas en Vercel. Así no quedan en el repositorio, aunque sí se ven en happa.es (la LSSI obliga a publicarlos). Sin ellas, la página enseña "[pendiente: …]".
2. **Sectores:** servicios para el hogar, mudanzas, mobiliario y equipamiento del hogar, seguros, servicios financieros o de gestión de alquiler, y suministros.
3. **Datos que se ceden:** nombre, correo, idioma, código postal y tipo y tamaño del hogar.
4. **Plazo de la prueba de consentimientos:** 3 años, bloqueada.
5. **Buzones:** en Zoho Mail (UE).

Siguen pendientes:

6. **Revisión legal:** el texto lo redacta Claude con cuidado, pero no es asesoramiento legal. Debe revisarlo alguien con formación en protección de datos antes del lanzamiento.
7. **Registro de actividades de tratamiento** (documento interno del RGPD): valorar si hace falta, sobre todo por los menores.
8. **Programar el borrado automático** en la base de datos oficial (ver 7.1): un paso a mano en Supabase.

## 6. Fuera de este cambio

- Enviar de verdad correos de marketing (cuando haya algo que enviar).
- Descargar tus datos desde la app (de momento, por correo a privacidad@happa.es).
- Pedir a los usuarios actuales que acepten la nueva versión de la política.
- Cuentas de menor gestionadas por adultos.
- El directorio de profesionales (la política ya lo contempla).
- Deducir la ciudad a partir del código postal.

## 7. Parte técnica

### 7.1 Base de datos (migración 19)

**Tabla `public.privacy_choices`** (solo se añaden filas, nunca se cambian ni se borran, salvo el borrado a los 3 años):

| Columna | Qué guarda |
|---|---|
| `id` | número correlativo |
| `user_id` | la persona (referencia a `profiles`) |
| `purpose` | `marketing` o `partners` |
| `granted` | sí o no |
| `text_version` | versión del texto que vio (por ejemplo `v1`) |
| `source` | `signup` (al registrarse) o `settings` (desde el perfil) |
| `created_at` | fecha y hora, la pone el servidor |

- Lo vigente es la última fila de cada persona y finalidad.
- **RLS:** cada persona solo lee las suyas (y no las de una cuenta borrada: quedan bloqueadas). Nadie puede insertar, cambiar ni borrar directamente.
- **`set_privacy_choice(purpose, granted, version)`:** única forma de cambiarlas desde la app (`source = settings`). Rechaza cuentas de menor y cuentas borradas.
- **`get_my_privacy_choices()`:** el estado actual de las dos, con la fecha del último cambio.
- **`handle_new_user`** (el disparador que ya crea el perfil) lee también `choices` de los datos del registro y guarda las dos decisiones con `source = signup`, tanto si son sí como si son no.
- **`households.postal_code`** (texto de 5 cifras, opcional). `create_household` recibe un código postal opcional y **`set_household_postal_code(household, code)`** lo cambia (solo admin; vacío para quitarlo).
- **Vista privada `private.partners_optin`:** quienes tienen `partners` activado ahora mismo, sin menores ni cuentas borradas, con nombre, correo (de `auth.users`), idioma, y el tipo, número de personas y código postal de cada hogar en el que viven ahora (una fila por persona y hogar; quien no tiene hogar sale una vez, sin esos datos), y fecha y versión de la aceptación. Está en el esquema `private`, que la API no publica: solo se consulta desde el SQL Editor de Supabase o en una copia de la base de datos.
- **Bloqueo y borrado:** al borrar la cuenta, sus filas se quedan (bloqueadas: la persona ya no existe para la app y no salen en la vista). **`privacy_choices_purge()`** borra las de cuentas borradas hace más de 3 años, y también sus filas de `legal_consents` (los términos y la privacidad aceptados), que se conservan igual. Se programa con `pg_cron` en Supabase (Database → Extensions → pg_cron, y en el SQL Editor: `select cron.schedule('privacidad-purga', '30 4 * * 0', 'select public.privacy_choices_purge()');`), igual que los gastos fijos.

### 7.2 App

- `src/features/legal/owner.ts`: los datos del titular desde las variables de entorno; si faltan, "[pendiente: …]" como hasta ahora. `.env.example` con las tres variables (vacías).
- `src/features/legal/content/privacy.tsx`: la política (es/en), con el mismo formato que `terms.tsx`. `LegalPage` la enseña en vez del aviso de "en preparación".
- `src/features/legal/versions.ts`: `privacy: "v1-2026-10-20"` y las versiones de los textos de las casillas.
- Registro (`SignupForm`, `schemas.ts`, `actions.ts`): la tabla de información básica, las dos casillas opcionales y su envío en los datos del registro.
- Perfil: página nueva `/perfil/privacidad` con los dos interruptores (Server Action que llama a `set_privacy_choice`) y enlace desde el perfil.
- Hogares: el código postal opcional al crear el hogar y en Configuración.
- Textos en `messages/es.json` y `messages/en.json`.
- Tipos de Supabase regenerados (`src/types/database.types.ts`).
- `supabase/seed.sql`: Ana con las dos aceptadas y Bruno con ninguna; el piso con código postal.

### 7.3 Cómo se comprueba

1. `npx supabase db reset`: la migración y el seed se aplican sin errores.
2. En la base de datos local: registro con y sin las casillas (se guardan las dos decisiones con `signup`); cambiar los interruptores (se añaden filas, no se cambian); un usuario no puede leer las de otro ni escribir en la tabla; la vista privada no responde desde la API y solo lista a quien tiene `partners` activado, con su código postal; el borrado a los 3 años solo quita filas de cuentas borradas hace más de 3 años.
3. En la app (`npm run dev`): registro, Perfil → Privacidad, el código postal del hogar y la política en español e inglés.
4. `npm run lint` y `npm run build`.
5. Al publicar: variables del titular en Vercel, `npx supabase db push` justo antes del merge (hay migración nueva) y programar el borrado con `pg_cron`.
