# HAPPA

App para organizar la convivencia en un hogar compartido (pisos de estudiantes, parejas y familias):
lista de la compra, gastos, tareas, horarios, chat, ruleta y avisos. Está en **https://happa.es**.

Hecha con Next.js 16 (App Router) y TypeScript, CSS Modules, Supabase (base de datos, cuentas, fotos y
tiempo real) y next-intl (español e inglés). Se publica en Vercel y los correos salen por Resend.

## Dos bases de datos: local y oficial

|  | **Local** | **Oficial** |
|---|---|---|
| Qué es | Supabase en tu ordenador (Docker) | proyecto de Supabase en la nube (el de happa.es) |
| Lo usa | `npm run dev` (tu `.env.local`) | https://happa.es y las versiones de prueba de cada rama en Vercel |
| Las migraciones llegan | `npx supabase db reset` | solas, al fusionar en `main` ([GitHub Actions](.github/workflows/migraciones-produccion.yml)) |
| Datos | los de `supabase/seed.sql` (usuarios `@happa.test`, contraseña `happa1234`) | los de la gente |

Así lo que pruebas en tu ordenador nunca toca los datos de la gente, y un cambio en la base de datos solo
llega a la oficial cuando ya está probado y fusionado.

**Ojo con las versiones de prueba de Vercel** (las `…vercel.app` de cada rama): usan la base de datos
**oficial**. Lo que hagas en ellas cambia datos reales, y si la rama trae una migración nueva, ahí fallará
hasta que se fusione. Úsalas solo para lo que no se puede probar en local (lo que exige https: instalar la
app, avisos al móvil, página sin conexión).

### Cómo se trabaja

1. Rama nueva desde `main` actualizado (`git switch main && git pull && git switch -c nombre`).
2. Si hay una migración nueva (`npx supabase migration new nombre`): `npx supabase db reset` la aplica en
   **local** (borra la local y la rehace con todas las migraciones y el seed). Prueba con `npm run dev`.
3. PR → revisa los cambios → fusiona en `main`: Vercel publica happa.es y GitHub aplica las migraciones a
   la oficial (pestaña **Actions** de GitHub para ver cómo ha ido).

Tu ordenador no está enlazado con el proyecto oficial (`npx supabase unlink`) y no hay que hacer `db push`
a mano: para eso está el paso 3. Así, un comando equivocado no puede tocar la oficial.

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
