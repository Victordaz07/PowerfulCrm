# Arquitectura — decisiones y por qué

## Multi-tenancy: `tenant_id` compartido + RLS (no esquema-por-tenant)

Con ~200 cuentas, esquema-por-tenant obliga a correr cada migración 200 veces y duplica índices y conexiones — inmanejable operativamente. El patrón elegido:

- Una sola base de datos, un solo esquema.
- Cada tabla de negocio lleva `tenant_id` (indexado).
- Row-Level Security de Postgres como **defensa en profundidad**: aunque el código de la aplicación olvide filtrar por tenant, la base de datos no devuelve filas de otro tenant.

## El detalle que rompe todo si se ignora: pooling de Neon

Neon usa PgBouncer en **modo transacción**: las conexiones se reciclan entre transacciones distintas. Un `SET app.current_tenant = 'x'` a nivel de sesión persiste en la conexión reciclada — el siguiente tenant que la reutilice heredaría el filtro del anterior, una fuga cross-tenant real sin ningún ataque de por medio.

**Solución obligatoria:** `set_config('app.current_tenant', tenantId, true)` — el tercer argumento `true` lo hace *local a la transacción actual*, se revierte solo al hacer commit/rollback. Por eso `forTenant()` en `src/lib/prisma.ts` envuelve cada operación en una transacción explícita.

## Flujo de una request típica

```
Request → Clerk resuelve userId + orgId
        → getTenantDb() usa orgId como tenantId
        → forTenant(tenantId) devuelve un cliente Prisma
        → cada query de ese cliente corre dentro de una transacción
          que primero fija set_config('app.current_tenant', ...)
        → Postgres aplica las políticas RLS de prisma/rls.sql
        → solo vuelven filas de ese tenant, garantizado por la BD
```

## Por qué Inngest y no cron nativo de Vercel

Vercel Functions son síncronas y de vida corta. Facturas recurrentes y recordatorios necesitan reintentos, observabilidad y ejecución programada confiable. Inngest corre sobre tu propio despliegue de Vercel (no manda tu código a otro lado), da un dashboard de ejecución y reintentos por paso sin infraestructura adicional.

## Por qué `@react-pdf/renderer` y no Puppeteer

Puppeteer necesita empaquetar Chromium — no cabe cómodamente en una función serverless y tarda 2-5s por PDF. `@react-pdf/renderer` genera en <500ms, sin binario pesado, con texto seleccionable/buscable y soporte de acentos en español.

## Próximo umbral de escala

Este diseño sostiene cientos de tenants sin cambios. Si algún día un cliente exige aislamiento físico por regulación, ese tenant puntual se puede mover a una base dedicada — no hace falta rediseñar el resto del sistema para eso.
