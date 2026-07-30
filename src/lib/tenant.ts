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
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding"); // el usuario aún no pertenece a ningún tenant

  // orgId de Clerk === tenantId en nuestro modelo (1 org = 1 tenant)
  return { db: forTenant(orgId), tenantId: orgId };
}

/** Solo para scripts de sistema / webhooks — nunca en rutas de usuario. */
export function getSystemDb() {
  return rawPrisma;
}
