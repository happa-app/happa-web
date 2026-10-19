# HAPPA

App para organizar la convivencia en un hogar compartido (pisos de estudiantes, parejas y familias):
lista de la compra, gastos, tareas, horarios, chat, ruleta y avisos. Está en **https://happa.es**.

Hecha con Next.js 16 (App Router) y TypeScript, CSS Modules, Supabase (base de datos, cuentas, fotos y
tiempo real) y next-intl (español e inglés). Se publica en Vercel y los correos salen por Resend.

## Tres bases de datos: local, pruebas y oficial

|  | **Local** | **Pruebas** | **Oficial** |
|---|---|---|---|
| Qué es | Supabase en tu ordenador (Docker) | proyecto de Supabase en la nube | proyecto de Supabase en la nube (el de happa.es) |
| Lo usa | `npm run dev` (tu `.env.local`) | las versiones de prueba de cada rama en Vercel (Preview) | https://happa.es (Production en Vercel) |
| Las migraciones llegan | `npx supabase db reset` | `npx supabase db push` desde tu ordenador | solas, al fusionar en `main` ([GitHub Actions](.github/workflows/migraciones-produccion.yml)) |
| Datos | los de `supabase/seed.sql` (usuarios `@happa.test`, contraseña `happa1234`) | de prueba | los de la gente |

Así lo que pruebas nunca toca los datos de la gente, y un cambio en la base de datos solo llega a la
oficial cuando ya está probado y fusionado.

### Cómo se trabaja

1. Rama nueva desde `main` actualizado (`git switch main && git pull && git switch -c nombre`).
2. Si hay una migración nueva (`npx supabase migration new nombre`): `npx supabase db reset` la aplica en
   **local** (borra la local y la rehace con todas las migraciones y el seed). Prueba con `npm run dev`.
3. Antes de abrir la PR, si hay migración nueva: `npx supabase db push`. Va a **pruebas**, porque tu
   ordenador está enlazado al proyecto de pruebas (para comprobarlo: `cat supabase/.temp/project-ref`).
   Sin esto, la versión de prueba de Vercel no tendría las tablas nuevas.
4. Prueba en la versión de prueba que Vercel crea en la PR (lo que exige https: instalar la app, avisos
   al móvil, página sin conexión).
5. Fusiona la PR en `main`: Vercel publica happa.es y GitHub aplica las migraciones a la oficial
   (pestaña **Actions** de GitHub para ver cómo ha ido).

No enlaces tu ordenador al proyecto oficial ni hagas `db push` a mano contra él: para eso está el paso 5.

Vercel publica la web y GitHub aplica las migraciones a la vez, así que durante unos segundos el código
nuevo puede funcionar con la base de datos de antes. Por eso las migraciones tienen que ser compatibles
con la versión anterior de la app: añadir tablas o columnas sí; borrar o renombrar algo que la app aún usa,
en dos pasos (primero se deja de usar en el código, y en una PR posterior se borra).

## Arrancar en tu ordenador

Necesitas Docker (para la base de datos local) y Node 22.

```bash
npm install
npx supabase start           # la base de datos local; al acabar muestra su URL y sus claves
cp .env.example .env.local   # y rellénalo con la URL local y la clave "Publishable" de `npx supabase status`
npm run dev
```

Para entrar: `ana@happa.test` / `happa1234` (más usuarios en `supabase/seed.sql`). El panel de la base de
datos local está en http://127.0.0.1:54323 y los correos que manda, en http://127.0.0.1:54324.

## Dónde está cada cosa

- `src/app`: las páginas.
- `src/features`: cada parte de la app (gastos, tareas, chat, perfil…), con sus componentes y su acceso a datos.
- `messages`: los textos en español (`es.json`) e inglés (`en.json`).
- `supabase/migrations`: la base de datos, un archivo por cambio (nunca se edita uno ya aplicado).
- `supabase/seed.sql`: los datos de prueba de la base de datos local.
- `public/sw.js`: el service worker (avisos al móvil y página sin conexión).
