# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# HAPPA — contexto del proyecto

App de gestión del hogar compartido (pisos de estudiantes, parejas y familias). Primer lanzamiento: **PWA web** en Vercel, como prototipo de captación. Más adelante, app nativa.

## Equipo y forma de trabajar
- Un único desarrollador (yo). Vengo de HTML, CSS, JS puro y SQL; **es mi primer proyecto con React/Next.js**: explica las decisiones de React que no sean obvias y no metas abstracciones innecesarias.
- Escribe la interfaz y los comentarios en **español**. Idiomas de la app: español e inglés.
- Antes de cambios grandes, propón un plan y espera mi OK.
- Presupuesto bajo: planes gratuitos siempre que se pueda.

## Stack
- Next.js 16 (TypeScript, App Router) con React 19, **sin Tailwind**: estilos con CSS Modules, más `src/styles/globals.css` y `src/styles/tokens.css`. Validación con zod 4.
- Supabase: Postgres, Auth (con confirmación por email activada), Realtime, Storage (fotos de perfil). Las migraciones van en `supabase/migrations` y el proyecto local está enlazado con la CLI.
- Vercel (plan gratuito) para el despliegue.
- Resend (dominio happa.es) para los correos automáticos de Supabase Auth.
- Stripe más adelante (suscripción mensual de profesionales): la BD ya está preparada (`billing_customers`, `subscriptions`).
- Node 22 (nvm). Repo: github.com/happa-app/happa-web.

## Seguridad (la app va a ser pública)
- **RLS activado en todas las tablas**, con políticas explícitas. Nunca uses la service_role key: todo el código usa la clave anon, también en el servidor.
- Secretos solo en `.env.local` (en `.gitignore`) y en las variables de Vercel. Nunca los subas al repo.
- Hay menores (hogares familiares): cuidar privacidad, RGPD, cookies y política de privacidad.
- Captcha (Cloudflare Turnstile) activado en Supabase Auth: lo piden el registro, el login, recuperar la contraseña y la sesión aparte de `fresh.ts`. Cualquier formulario nuevo que llame a esas funciones de Auth necesita `<Captcha />` (`src/components/ui/Captcha.tsx`) y pasar `captchaToken(formData)` (`src/lib/captcha.ts`). Sin `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no se pinta (en local va la clave de prueba, ver `supabase/config.toml`).

## Modelo de datos (reglas clave)
- Un usuario puede pertenecer a varios hogares. Un profesional no puede ser también usuario de un hogar (`account_type` = `resident` | `professional`; la BD lo impide).
- Roles en un hogar: `admin`, `member`, `minor` y `landlord` (casero). "Adultos" = `admin` y `member`.
- Cada hogar tiene un número máximo de personas (`max_members`, 1–20); si está lleno, el código de invitación no deja entrar.
- Menores: cuenta intermedia gestionada por los adultos del hogar (`guardianships`).
- Diseñar pensando ya en lo que vendrá después: marketplace de profesionales, RRPP, caseros, Stripe.

## Navegación
Barra inferior: **Más · Inicio · Casas · Ruleta · Chat**. Las personas, el código de invitación, las plazas y salir del hogar van en Más → Configuración (`hogar/[id]/configuracion`).

## Funcionalidades y reglas de producto
- **Gastos** (en la interfaz no usar el nombre "Tricount" ni "triqui"; en la BD la parte de gastos se llamaba "triqui" y algunas funciones y la migración conservan ese nombre interno: no los renombres). Reparto entre todos, algunos o por partes; ajuste automático de deudas. Al crearse un gasto lo confirman todos los participantes. Antes de confirmarse lo edita o borra quien lo creó o un admin; después, solo un admin. Un pago lo marca quien paga y lo confirma quien recibe. Hechos también "compra → gasto" y los gastos fijos (suscripciones, internet, luz...), que se cargan solos.
- **Lista de la compra**: una común por hogar (en vivo para todos) y una personal por persona que se comparte al hogar que elija, mostrando quién lo pidió.
- **Horario**: uno por hogar, importable de otro. Sirve para saber quién está en casa.
- **Tareas**: cuentan como hechas al marcarlas; cualquier adulto puede decir "no está hecha" y vuelve a pendiente. Si la tarea pide visto bueno y la marca un menor, espera a que un adulto la apruebe. Si se pasa el día, sigue siendo de esa persona como atrasada. Si le toca a alguien ausente, se salta y la recupera a la vuelta.
- **Ruleta "del marrón"**: 100 % aleatoria (la elección la hace la BD con `random()`).
- **Chat**: hecho el de inquilinos, con votaciones (las crean los adultos; quien la crea elige si son de una o varias respuestas y si votan los menores; votos públicos; nunca se cierran y el voto se puede cambiar); el del casero es para la fase 2 (el tipo `landlord` ya existe en la BD). Quien se va del hogar con saldo pendiente en gastos sigue en el chat hasta saldarlo; quien se va sin deudas deja de verlo.
- **Pendiente (sin implementar)**: opiniones (una automática por cumplimiento de tareas y otra anónima de compañeros al final de la estancia, con estrellas + campos como limpieza o pagos), racha (criterio por decidir), series/subs, caja de herramientas (QR del wifi, contratos), recetas (pasos y macros), juegos de previa, buscador de habitaciones libres.

## Estado actual
- App desplegada en Vercel como PWA (manifest, iconos, página sin conexión y service worker). Funciones en Fráncfort (`vercel.json` → `fra1`), junto a Supabase (`eu-central-1`).
- Hechos: portada pública (qué es, cómo funciona y cómo instalarla), hogares e invitaciones, plazas, compra, gastos (con compra → gasto y fijos), horarios y ausencias, tareas, chat, avisos (en la app y push), ruleta, perfil (foto, cuenta, idioma, borrar la cuenta), recuperar la contraseña, ayuda y contacto (Más → Ayuda y contacto; se leen en `private.contact_inbox`) y páginas legales.
- 21 migraciones en `supabase/migrations`.
- Configurando Resend para los correos de Auth.

## Comandos
- `npm run dev` — servidor local
- `npm run build` — comprobar que compila antes de hacer push
- `npm run lint` — eslint
- `node scripts/push-keys.mjs` — genera las claves VAPID y el secreto de las notificaciones push
- No hay tests configurados (no hay script `test`). Para comprobar un cambio: `npm run lint` y `npm run build`.

Variables en `.env.local` (plantilla en `.env.example`): las de Supabase se validan con zod en `src/lib/env.ts` y la app no arranca si faltan. Las de push (`src/lib/push/config.ts`) son opcionales: si faltan, no se envían push y la app sigue funcionando. En local, `.env.local` apunta a la BD local (`http://127.0.0.1:54321`, clave publishable); las de la oficial están en las variables de Vercel. Claude no puede leer `.env.local` (permisos).

## Base de datos local (para desarrollar sin tocar la oficial)
Supabase local en Docker. La oficial solo recibe migraciones con `db push`.
- `npx supabase start` / `npx supabase stop` — arrancar y parar (los datos se conservan). Studio: http://127.0.0.1:54323 · correos de prueba: http://127.0.0.1:54324
- `npx supabase db reset` — borra la BD **local** y la rehace con todas las migraciones + `supabase/seed.sql`. Nunca con `--linked` (borraría la oficial).
- Usuarios de prueba (contraseña `happa1234`): `ana@happa.test` (admin del "Piso de prueba"), `bruno@happa.test`, `carla@happa.test` (tiene un gasto pendiente de confirmar) y `dani@happa.test` (sin hogar).
- `seed.sql` crea los datos llamando a las funciones SQL de la app haciéndose pasar por cada usuario (`request.jwt.claims` + `set local role authenticated`). Todo el seed va en una transacción: cada bloque acaba con `set constraints all immediate` para que los avisos (triggers diferidos) salgan con el autor correcto. Si una migración cambia una regla, actualiza el seed.
- Migración nueva: `npx supabase migration new <nombre>` → `npx supabase db reset` para probarla → `npx supabase gen types typescript --local > src/types/database.types.ts`.

## Git y despliegue
- `main` = lo publicado: cada push a `main` lo publica Vercel en happa.es. **Nunca trabajar ni hacer commits directamente en `main`.**
- Una rama por tarea, que sale de `main` actualizado (`git checkout main && git pull && git checkout -b <nombre>`). Commits pequeños y frecuentes.
- Cada push a cualquier rama crea una versión de prueba en Vercel (https, protegida con login de Vercel; usa la BD oficial). Sirve para probar en el móvil lo que exige https: instalar la PWA, push y service worker. Lo demás se prueba en local con `npm run dev`.
- Al terminar: PR → revisar los cambios y la versión de prueba → merge. Si la rama trae migraciones, `npx supabase db push --linked` **antes** del merge, para que el código nuevo no llegue sin sus tablas (con `--linked`: en la próxima versión de la CLI, sin él irá a la BD local).
- Tras el merge: `git checkout main && git pull && git branch -d <nombre>`.

## Arquitectura

### Proxy (antes middleware)
`src/proxy.ts` se ejecuta antes de cada petición y hace, en orden: 1) refrescar la sesión de Supabase (`src/lib/supabase/proxy.ts`), 2) proteger rutas y 3) aplicar el idioma. **Toda ruta es privada por defecto**; las públicas se declaran en `PUBLIC_PATHS`/`PUBLIC_PREFIXES`. `/api` y `/auth/*` quedan fuera del routing de idioma.

### i18n (next-intl)
Español sin prefijo (`/login`), inglés con `/en` (`localePrefix: "as-needed"`). Las páginas cuelgan de `src/app/[locale]/`: `(auth)` para login/registro, `(app)` para la app con sesión, y las secciones de un hogar en `hogar/[id]/...` (cada página comprueba el acceso y llama a `notFound()` si no lo hay). Textos en `messages/es.json` y `messages/en.json`: mantén las mismas claves en los dos. Para navegar usa `Link`/`redirect` de `@/i18n/navigation`; la excepción es redirigir a una ruta que ya lleva el idioma (el `?next=` del login), donde se usa el `redirect` de `next/navigation`. Las Server Actions reciben el idioma por un campo `locale` del formulario (`parseLocale`).

### Features (`src/features/<feature>/`)
Patrón común (no todas tienen todos los archivos; copia el de una feature parecida):
- `index.ts`: API pública (componentes y tipos). El resto de la app importa desde `@/features/<feature>`.
- `queries.ts`: lecturas para las páginas, en el servidor (con `@/lib/supabase/server`). `server.ts` reexporta lo que pueden usar las páginas. **Nunca se importan desde un componente `"use client"`.**
- `actions.ts` (`"use server"`): Server Actions con firma `(prevState, formData)` para `useActionState`. Validan el formulario con `schemas.ts` (zod) y llaman a funciones SQL con `supabase.rpc(...)`, que son las que comprueban permisos y aplican la lógica de negocio. Excepciones: `auth` usa Supabase Auth y `profile` escribe también en tablas y en Storage.
- `api.ts` + `hooks/use*.ts`: solo en las features en vivo (compra, chat, ruleta), sin Server Actions. `api.ts` recibe un `AppSupabaseClient` para servir igual en servidor y navegador; el hook lleva el estado en el cliente con Supabase Realtime. La compra **relee la lista entera** en cada evento (`useShoppingList.ts`); el chat mete en la lista cada mensaje que llega (`useChat.ts`).
- `errors.ts`: traduce los mensajes de los `raise exception` de SQL a claves de i18n. Si cambias un mensaje en una migración, actualiza el `errors.ts` correspondiente.
- Además: `types.ts`, `components/` y módulos de lógica pura sin React (`logic.ts`, `split.ts`, `settle.ts`, `dates.ts`...).

Tema claro/oscuro: los colores van **siempre** con las variables de `src/styles/tokens.css`, que tienen su versión oscura en `:root[data-theme="dark"]`; no escribas colores a mano en el CSS. Para texto encima de un color fuerte (botones verdes...) usa `--color-on-accent`. La elección (igual que el dispositivo, claro u oscuro) se guarda en el navegador y la aplica el script de `src/lib/theme.ts` antes de pintar.

Pantallas de carga: cada carpeta de `(app)` que tiene páginas dentro lleva un `loading.tsx` de una línea que reexporta `PageSkeleton` (`src/components/ui/PageSkeleton.tsx`). Un `loading.tsx` solo aparece cuando cambia la carpeta que tiene justo debajo: si creas una carpeta con subpáginas, añádele el suyo.

Los formularios con estado controlado se envían con `submitWithoutReset` (`src/utils/forms.ts`) para evitar el reset automático de React 19.

### Supabase
- Clientes: `src/lib/supabase/server.ts` (cookies), `client.ts` (navegador) y `fresh.ts` (sesión aparte para volver a pedir la contraseña en operaciones delicadas). La seguridad depende de RLS y de las funciones SQL.
- Los comentarios del código citan "migración N" según el orden de los archivos de `supabase/migrations/`.

### Notificaciones push
Los avisos los crea la BD. Las Server Actions que pueden crearlos (gastos y tareas) llaman a `schedulePushDispatch()`, que ejecuta `dispatchPush` con `after()` cuando ya se ha respondido. Lo que se escribe directamente desde el navegador (chat, compra y ruleta) llama a `POST /api/push` mediante `requestPushDispatch`. `dispatchPush` reclama los avisos pendientes con el RPC `push_claim` (protegido por un secreto guardado en `private.secrets`) y los envía con web push propio (`src/lib/push/webpush.ts`). El service worker está en `public/sw.js`.
