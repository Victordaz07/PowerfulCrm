# FreelanceHub

CRM + gestor de proyectos + calendario + facturación en una sola plataforma multi-tenant, para freelancers y creadores independientes. Ver `docs/ARQUITECTURA.md` para el porqué de cada decisión técnica y `docs/IMAGENES-DALLE.md` para los prompts de imágenes.

## Stack

Next.js 14 (App Router) · Prisma · PostgreSQL (Neon) · Vercel + Vercel Blob · Clerk (auth multi-tenant) · Stripe / Mercado Pago · Inngest (jobs) · `@react-pdf/renderer` · TanStack Query · shadcn/ui + Radix + Tailwind

## Arranque paso a paso

### 1. Clona e instala
```bash
npm install
cp .env.example .env
```

### 2. Base de datos (Neon)
1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la **connection string pooled** (con `?pgbouncer=true`) a `DATABASE_URL`.
3. Copia la **connection string directa** a `DIRECT_URL`.
4. Corre las migraciones:
   ```bash
   npm run db:migrate
   ```
5. Aplica las políticas de Row-Level Security (aislamiento entre tenants):
   ```bash
   psql "$DIRECT_URL" -f prisma/rls.sql
   ```
6. (Opcional) Carga datos de ejemplo:
   ```bash
   npm run db:seed
   ```

### 3. Autenticación (Clerk)
1. Crea una app en [clerk.com](https://clerk.com).
2. **Activa "Organizations"** en el dashboard de Clerk — cada organización de Clerk es un tenant en nuestro modelo (`orgId` de Clerk = `tenantId` en Prisma).
3. Copia las claves a `.env`.
4. Cuando un usuario se registra, debe crear u unirse a una organización antes de acceder al dashboard — el helper `getTenantDb()` en `src/lib/tenant.ts` redirige a `/onboarding` si no tiene una.

### 4. Pagos (Stripe)
1. Copia tus claves de prueba a `.env`.
2. Corre `stripe listen --forward-to localhost:3000/api/webhooks/stripe` en desarrollo.
3. Para producción, registra el endpoint `/api/webhooks/stripe` en el dashboard de Stripe y copia el signing secret a `STRIPE_WEBHOOK_SECRET`.
4. Si tu público es LatAm, añade Mercado Pago como segunda pasarela (no incluido aún — ver roadmap fase 2 en el informe de investigación).

### 5. Jobs en background (Inngest)
1. Crea una cuenta en [inngest.com](https://www.inngest.com) (el free tier alcanza sobradamente para 200 tenants).
2. Copia las claves a `.env`.
3. En desarrollo, corre `npx inngest-cli@latest dev` en paralelo a `npm run dev` para ver el dashboard local de jobs.
4. Las funciones ya definidas (`src/inngest/functions.ts`): generación diaria de facturas recurrentes y marcado/recordatorio horario de facturas vencidas.

### 6. Email transaccional (Resend)
Crea cuenta en [resend.com](https://resend.com), verifica tu dominio, copia la API key.

### 7. Levanta el proyecto
```bash
npm run dev
```

## Qué SÍ está construido en este scaffold

- Modelo de datos completo (`prisma/schema.prisma`) con `tenant_id` en cada tabla.
- Aislamiento multi-tenant con RLS (`prisma/rls.sql`) + extensión de Prisma que fija el tenant vía `set_config` dentro de una transacción (obligatorio con el pooling de Neon — ver comentarios en `src/lib/prisma.ts`).
- Helper `getTenantDb()` que conecta Clerk Organizations con el tenant activo.
- UI base: sidebar de navegación, dashboard con métricas reales, pipeline kanban de CRM, listado de proyectos con progreso, tabla de facturación.
- Generación de PDF de facturas del lado del servidor.
- Webhook de Stripe que marca facturas como pagadas.
- Dos jobs de Inngest: facturas recurrentes y recordatorios de vencimiento.
- Sistema de diseño propio (paleta "ink + amber", no los defaults genéricos de IA) en `tailwind.config.ts`.

## Qué falta construir (siguiente paso lógico, en orden)

1. **Formularios de creación/edición** (cliente, lead, proyecto, tarea, factura) — usa Server Actions + `zod` para validar.
2. **Drag-and-drop real** en el kanban de CRM y de tareas — `dnd-kit` + mutación optimista de TanStack Query (`onMutate` → actualiza caché al instante → `onError` hace rollback).
3. **Command palette** (Cmd+K) con `cmdk` — ya hay un botón placeholder en el sidebar (`data-command-trigger`).
4. **Checkout de Stripe** desde el botón "Cobrar" de una factura (crear Checkout Session con `metadata.invoiceId`).
5. **Calendario/agendamiento** — evalúa embeber Cal.diy (antes Cal.com self-hosted) en vez de construir el motor desde cero.
6. **Onboarding** (`/onboarding`): flujo para crear la primera organización/tenant en Clerk.
7. **Multi-moneda y cálculo de impuestos** por país.
8. **Empty/loading/error states** diseñados para cada vista (usa `loading.tsx` de Next.js + skeletons, ya hay la clase `.skeleton` en `globals.css`).

## Convenciones para trabajar con IA (Cursor / Claude / Antigravity)

- **Todo modelo nuevo en `schema.prisma` debe llevar `tenantId`** y su índice `@@index([tenantId])`. Después de añadir un modelo, agrégalo también al arreglo de tablas en `prisma/rls.sql`.
- **Nunca uses `rawPrisma` directamente en una ruta de usuario** — siempre pasa por `getTenantDb()`. `rawPrisma` es solo para webhooks y jobs de sistema (donde el `tenantId` se filtra a mano en cada query, como en `src/inngest/functions.ts`).
- Componentes de UI nuevos van en `src/components/ui` (primitivas) o `src/components/layout` (estructura de página) — sigue el patrón `cva` + `cn()` ya usado en `button.tsx`.
