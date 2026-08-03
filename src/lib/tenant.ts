import { auth } from "@clerk/nextjs/server";
import { rawPrisma, forTenant } from "./prisma";
import { redirect } from "next/navigation";

/**
 * Resuelve el tenant activo del usuario autenticado (via Clerk
 * Organizations, org.id) y devuelve un cliente Prisma ya scoped
 * a ese tenant. Úsalo en cada Server Component / Route Handler
 * que toque datos de negocio.
 *
 *   const db = await getTenantDb();
 *   const clients = await db.client.findMany();  // ya filtrado por RLS
 */
export async function getTenantDb() {
  const { orgId, userId, orgSlug } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding"); // el usuario aún no pertenece a ningún tenant

  // Red de seguridad: la vía principal de aprovisionamiento es el
  // webhook `organization.created`/`organization.updated` de Clerk
  // (ver src/app/api/webhooks/clerk/route.ts). Este upsert idempotente
  // se deja aquí por si ese webhook falla, llega tarde, o no está
  // configurado todavía en un entorno — barato comparado con dejar
  // rotas todas las escrituras del tenant por una FK violation.
  // orgId de Clerk === id de Tenant en nuestro modelo (1 org = 1 tenant).
  await rawPrisma.tenant.upsert({
    where: { id: orgId },
    update: {},
    create: { id: orgId, name: orgSlug ?? "Mi negocio", slug: orgSlug ?? orgId },
  });

  return { db: forTenant(orgId), tenantId: orgId };
}

/** Solo para scripts de sistema / webhooks — nunca en rutas de usuario. */
export function getSystemDb() {
  return rawPrisma;
}
