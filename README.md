# HAPPA

App para organizar la convivencia en un hogar compartido (pisos de estudiantes, parejas y familias):
lista de la compra, gastos, tareas, horarios, chat, ruleta y avisos. Está en **https://happa.es**.

Hecha con Next.js 16 (App Router) y TypeScript, CSS Modules, Supabase (base de datos, cuentas, fotos y
tiempo real) y next-intl (español e inglés). Se publica en Vercel y los correos salen por Resend.

## Dos bases de datos: pruebas y oficial

|  | **Pruebas** | **Oficial** |
|---|---|---|
| Proyecto de Supabase | el de pruebas | el oficial (el de happa.es) |
| Lo usan | `npm run dev` (tu `.env.local`) y las versiones de prueba de cada PR en Vercel (Preview) | https://happa.es (Production en Vercel) |
| Las migraciones llegan | con `npx supabase db push` desde tu ordenador | solas, al fusionar en `main` ([GitHub Actions](.github/workflows/migraciones-produccion.yml)) |

Así lo que pruebas nunca toca los datos de la gente, y un cambio en la base de datos solo llega a la
oficial cuando ya está probado y fusionado.

### Cómo se trabaja

1. Rama nueva (`git switch -c nombre`) y los cambios.
2. Si hay una migración nueva: `npx supabase db push`. Va a **pruebas**, porque tu ordenador está enlazado
   al proyecto de pruebas (para comprobarlo: `cat supabase/.temp/project-ref`).
3. Prueba con `npm run dev` y en la versión de prueba que Vercel crea en la PR.
4. Fusiona la PR en `main`: Vercel publica happa.es y GitHub aplica las migraciones a la oficial
   (pestaña **Actions** de GitHub para ver cómo ha ido).

No enlaces tu ordenador al proyecto oficial ni hagas `db push` a mano contra él: para eso está el paso 4.
Las pruebas de SQL (`pruebas_*.sql`) también se ejecutan en el de pruebas.

## Arrancar en tu ordenador

```bash
npm install
cp .env.example .env.local   # y rellénalo con los valores del proyecto de PRUEBAS
npm run dev
```

## Dónde está cada cosa

- `src/app`: las páginas.
- `src/features`: cada parte de la app (gastos, tareas, chat, perfil…), con sus componentes y su acceso a datos.
- `messages`: los textos en español (`es.json`) e inglés (`en.json`).
- `supabase/migrations`: la base de datos, un archivo por cambio (nunca se edita uno ya aplicado).
- `supabase/templates`: los correos de Supabase (se copian a mano en el panel; ver su README).
- `public/sw.js`: el service worker (avisos al móvil y página sin conexión).
