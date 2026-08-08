import { PrismaClient } from "@prisma/client";
import { withDbRetry } from "./db-retry";

// Cliente "base" sin tenant — úsalo SOLO para operaciones de sistema
// (webhooks, jobs cross-tenant, scripts de admin). Nunca en rutas
// normales de la app.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawPrisma;

/**
* Devuelve un cliente Prisma con el tenant fijado para TODA la vida
* de esta llamada. Internamente:
* 1) abre una transacción
* 2) hace `SELECT set_config('app.current_tenant', $tenantId, true)`
* (el 3er argumento `true` = local a la transacción, obligatorio
* con el pooling en modo "transaction" que usa Neon/PgBouncer —
* un SET de sesión normal se filtraría al siguiente tenant que
* reutilice la conexión del pool)
* 3) corre la query real dentro de esa misma transacción
* Las políticas RLS (ver prisma/rls.sql) hacen el resto: cualquier
* fila que no pertenezca a ese tenant_id es invisible, incluso si el
* código de la app se equivoca en el filtro.
*
* IMPORTANTE: este patrón es el recomendado por Prisma, pero no
* compone limpiamente con `$transaction()` explícitas anidadas.
* Para operaciones batch, usa `withTenantTransaction` más abajo.
*
* El $transaction completo (incluyendo el set_config inicial) se
* envuelve con withDbRetry: si el compute de Neon está dormido
* (autosuspend en plan free) la apertura de la transacción falla con
* "Can't reach database server" — reintentamos unas pocas veces con
* backoff corto antes de propagar el error al usuario.
*/
export function forTenant(tenantId: string) {
  return rawPrisma.$extends({
    query: {
      $allOperations: async ({ args, query, operation, model }) => {
        // Modelos sin tenant_id propio (ej. join tables) pasan directo
      const [, result] = await withDbRetry(() =>
        rawPrisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(
            `SELECT set_config('app.current_tenant', $1, true)`,
            tenantId
            );
          // @ts-expect-error — delegamos al modelo/operación original dentro de la tx
                               return [null, await tx[model!][operation as string](args)];
        })
                                           );
        return result;
      },
    },
  });
}

/**
* Para flujos que ya necesitan su propia transacción (ej. crear una
* factura + sus items en un solo commit), fija el tenant una vez y
* expone el cliente transaccional normal de Prisma.
*
* También protegido con withDbRetry: si falla por conexión, Postgres
* ya hizo rollback automático de la transacción fallida, así que
* reintentar `fn` completo desde cero es seguro.
*/
export async function withTenantTransaction<T>(
  tenantId: string,
  fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
  ): Promise<T> {
  return withDbRetry(() =>
    rawPrisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_tenant', $1, true)`,
        tenantId
        );
      return fn(tx);
    })
                     );
}
