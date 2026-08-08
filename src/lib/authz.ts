import { auth } from "@clerk/nextjs/server";

/**
 * RBAC mínimo apoyado en los roles de Organization de Clerk, NO en
 * `TenantUser.role` (que existe en el schema pero hoy no se puebla en
 * ningún lado — nada escribe TenantUser todavía). Clerk ya administra
 * invitaciones y asignación de rol por su propio UI
 * (OrganizationSwitcher en la app / Dashboard de Clerk), así que
 * reusamos esa fuente de verdad en vez de duplicar estado que se
 * puede desincronizar.
 *
 * Roles por defecto de Clerk Organizations: "org:admin" (quien crea
 * la organización, y cualquiera a quien se le asigne ese rol) y
 * "org:member" (invitados). Si en el Dashboard de Clerk se definieron
 * roles custom con otras claves, ajustar ADMIN_ROLE_KEYS.
 */
const ADMIN_ROLE_KEYS = new Set(["org:admin", "org:owner"]);

export async function isTenantAdmin(): Promise<boolean> {
  const { orgRole } = await auth();
  return !!orgRole && ADMIN_ROLE_KEYS.has(orgRole);
}

/**
 * Lanza si el usuario actual no es admin/owner del tenant activo.
 * Úsalo al inicio de cualquier Server Action que borre datos o
 * cambie algo sensible (facturación, eliminar clientes/proyectos,
 * gestión del equipo, etc). Las Server Actions de solo lectura o de
 * creación normal (crear cliente, crear lead, crear evento...) no
 * necesitan este check — están abiertas a cualquier miembro del
 * tenant a propósito.
 */
export async function requireTenantAdmin(): Promise<void> {
  if (!(await isTenantAdmin())) {
    throw new Error(
      "No tienes permiso para realizar esta acción — se requiere rol de administrador del negocio."
    );
  }
}
