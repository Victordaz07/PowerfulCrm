# FreelanceHub (powerfulcrm) — memoria de proyecto para Claude

CRM/proyectos/facturación multi-tenant para freelancers. Next.js App
Router + Prisma/Neon Postgres + Clerk (auth, Organizations = tenants) +
Stripe (Checkout Sessions, redirect) + Inngest (jobs) + Vercel.

## Estado al 2026-08-02 (fin de sesión)

Rama de producción: `claude/multi-tenant-project-setup-vmanmh` — cada
push a esta rama dispara un deploy de PRODUCCIÓN en Vercel
(`powerful-crm.vercel.app`, proyecto `prj_XRdzejNax7LDMAtMFPAxDChHK33l`,
team `team_sLNo1ShZ17Eb3f09oaiQ91Zc`). Repo: github.com/Victordaz07/PowerfulCrm
(el remoto local usa minúsculas y redirige, es normal, no romper nada
por eso).

### EN CURSO: upgrade Next.js 14 → 16

Rama: `claude/nextjs-16-upgrade` (creada desde la rama de producción,
YA PUSHEADA, commit `55acb420b50d17f089bf9409f848227e139629a8`).
**Todavía NO está mergeada a producción** — falta confirmación
explícita del usuario antes de mergear (ver sección "Próximo paso").

Preview deployment validado y READY:
`https://powerful-crm-git-claude-n-dcc6ee-victor-ruizs-projects-2df6e656.vercel.app`
— el flujo de sign-in de Clerk renderiza perfecto ahí (probado con
Claude in Chrome), confirma que el publishableKey real de Vercel
funciona y que `proxy.ts` (antes `middleware.ts`) sigue interceptando
rutas correctamente.

Qué se hizo en el upgrade:
- `next` 14.2.35 → 16.2.12, `react`/`react-dom` 18.3.1 → 19.2.8.
- `@clerk/nextjs` se quedó en 6.x (`^6.5.0`, resuelve 6.39.6) a
  propósito — ya soporta Next 16 desde 6.34, no hacía falta el salto a
  7.x en la misma pasada (menos riesgo).
- `src/middleware.ts` → `src/proxy.ts` (Next 16 renombró la convención).
  El codemod NO renombra el archivo solo si usa `export default` en vez
  de una función nombrada `middleware` — hubo que hacerlo a mano
  (`git mv`). `clerkMiddleware()` no cambia de API.
- `searchParams`/`params` ahora son `Promise` en
  `calendario/page.tsx` y `portal/[token]/page.tsx` — lo resolvió el
  codemod oficial (`npx @next/codemod@canary upgrade latest`),
  verificado a mano.
- `.eslintrc.json` → `eslint.config.mjs` (flat config, obligatorio en
  `eslint-config-next` 16).
- **Gotcha importante**: `eslint@10.8.0` (lo que instala por defecto el
  codemod) tiene un bug real de compatibilidad con
  `typescript-eslint@8.65.0` — truena con
  `scopeManager.addGlobals is not a function` en CUALQUIER lint.
  Ver github.com/typescript-eslint/typescript-eslint issues #11829 y
  #11830. Fix: pinear `eslint` a `^9.39.5` (9.x sigue siendo la línea
  estable real hoy). Si en el futuro se quiere subir a eslint 10, hay
  que revisar si typescript-eslint ya lo arregló.
- **Gotcha importante**: `(dashboard)/layout.tsx` necesitó
  `export const dynamic = "force-dynamic";` explícito. En Next 14 el
  uso de `auth()`/cookies dentro de Clerk forzaba el bail-out a
  dynamic rendering de forma implícita; Turbopack en Next 16 intenta
  prerenderizar ANTES de detectar eso, y sin el publishableKey de
  Clerk disponible en build time revienta con "Missing publishableKey"
  en vez de simplemente marcar la ruta como dinámica. Si se agregan
  rutas nuevas fuera de `(dashboard)` que también dependan de
  `auth()`/`getTenantDb()`, revisar si necesitan el mismo tratamiento.
- `npm audit fix` (no breaking) aplicado para `glob`. `postcss`/`sharp`
  con CVEs altos quedan pendientes a propósito: están empaquetados
  DENTRO de `next/node_modules/*`, y la única "fix" que sugiere npm es
  degradar `next` a una versión canary de 9.x — no aplica. Mismo
  criterio que la auditoría de seguridad anterior de este proyecto.

Validación hecha:
- `npx tsc --noEmit` limpio.
- `npm run lint` limpio (con eslint 9.x).
- `npm run build` completo y exitoso localmente. **Ojo**: el build
  local necesita `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `.env.local`
  (que NO existe en este repo — Clerk/Stripe solo están configurados
  como env vars en Vercel, nunca en `.env` local). Para probar un build
  local hay que crear un `.env.local` temporal con una key con formato
  válido (`pk_test_` + base64 de algo terminado en `$`), correr el
  build, y BORRAR el archivo después — nunca commitear esa key dummy
  ni una real. `.env*.local` ya está en `.gitignore`.
- Deploy de Preview en Vercel: READY, sign-in de Clerk renderiza
  correctamente con las env vars reales.

### Próximo paso (para el siguiente agente o para mí mismo)

1. Confirmar con el usuario (Victor) si quiere mergear
   `claude/nextjs-16-upgrade` → `claude/multi-tenant-project-setup-vmanmh`.
   **No mergear sin luz verde explícita** — toca auth y pagos en
   producción real.
2. Idealmente, antes de mergear: pedirle a Victor que haga login real
   una vez en el link de Preview de arriba para confirmar que el
   dashboard carga con sus datos reales (yo no tengo sus credenciales
   de Clerk para probar el login real ni el flujo completo de
   Server Actions/Stripe Checkout autenticado).
3. Si aprueba: `git checkout claude/multi-tenant-project-setup-vmanmh
   && git merge claude/nextjs-16-upgrade && git push`. Eso dispara el
   deploy de producción automáticamente. Verificar con
   `get_deployment`/`get_runtime_logs` después, igual que se hizo con
   el portal de cliente.
4. Después de mergear, task pendiente aparte: el `webhook
   organization.created` de Clerk para provisionar tenants
   automáticamente (hoy se hace con upsert perezoso dentro de
   `getTenantDb()`, funciona pero es un parche, no la solución
   "correcta" a mediano plazo).

## Convenciones del proyecto (para cualquier trabajo futuro)

- **Multi-tenant**: `tenantId` en cada tabla, RLS activo en Neon
  producción, `getTenantDb()` en `src/lib/tenant.ts` es el punto de
  entrada normal (auth + scope automático + upsert perezoso del
  Tenant). `getSystemDb()` es SOLO para rutas sin contexto de tenant
  (ej. `/portal/[token]`, que se autentica por token, no por sesión de
  Clerk) — nunca usarlo en una ruta autenticada normal.
- **Créditos/secrets**: nunca se leen ni se imprimen en texto plano.
  Para pasarle un valor de `.env` a un comando o script, se extrae
  dentro del mismo proceso de shell (PowerShell) y se pasa como env
  var, nunca se hace `cat .env` ni se muestra el valor en un mensaje.
- **Migraciones de Prisma**: `prisma migrate dev` NO funciona en este
  entorno (no interactivo). Se escribe la carpeta de migración a mano
  siguiendo la convención de Prisma
  (`prisma/migrations/<timestamp>_<nombre>/migration.sql`) y se aplica
  con `prisma migrate deploy`.
- **Stripe**: Checkout Sessions con redirect a `checkout.stripe.com`,
  NO Stripe.js embebido. El webhook en
  `src/app/api/webhooks/stripe/route.ts` lee `session.metadata.invoiceId`
  para marcar facturas como pagadas — cualquier flujo de pago nuevo
  debe poblar ese metadata para reusar el webhook existente.
- **Verificación en producción**: nunca declarar algo "listo" sin
  probarlo de verdad — `tsc`/`eslint` primero, después un smoke test
  real (Claude in Chrome + `get_runtime_logs` de Vercel). Si se crean
  datos de prueba (clientes/facturas QA), limpiarlos después respetando
  el orden de FKs.
- **Rama de producción = auto-deploy**: cualquier push directo a
  `claude/multi-tenant-project-setup-vmanmh` es un deploy real. Cambios
  grandes/riesgosos (como este upgrade) van en una rama aparte primero,
  se validan en Preview, y se mergean solo con confirmación explícita.
- **RBAC**: `src/lib/authz.ts` (`isTenantAdmin()` / `requireTenantAdmin()`)
  es la fuente de verdad de permisos — se apoya en el rol de
  Organization de Clerk (`org:admin` / `org:member`), NO en
  `TenantUser.role`, que existe en el schema pero hoy no se puebla en
  ningún lado. Cualquier Server Action nueva que borre datos o toque
  algo sensible (facturación, eliminar clientes/proyectos, gestión del
  equipo) debe llamar `requireTenantAdmin()` al inicio. Las acciones de
  creación normal quedan abiertas a cualquier miembro a propósito. Hoy
  solo `deleteEvent` usa este check — es la única acción destructiva
  que existe en la app (no hay edit/delete de clientes, leads,
  proyectos ni facturas todavía).
- **Herramientas de archivo/shell en esta máquina**: los tools
  genéricos `Read`/`Write`/`Edit` del sandbox NO alcanzan
  `C:\Proyectos\powerfulcrm` (error "outside this session's connected
  folders"). Todo el trabajo en este repo se hace con las tools de
  Desktop Commander (`mcp__plugin_desktop-commander_desktop-commander__*`:
  `read_file`, `write_file`, `edit_block`, `start_process`/
  `interact_with_process`, etc.). Ese MCP a veces se desconecta y
  reconecta solo a mitad de sesión — si las tools desaparecen, hay que
  recargarlas con ToolSearch antes de seguir.
