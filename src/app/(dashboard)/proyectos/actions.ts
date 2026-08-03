"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(160),
  clientId: z.string().min(1, "Selecciona un cliente"),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createProject(formData: FormData) {
  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const { db, tenantId } = await getTenantDb();
  await db.project.create({
    data: {
      tenantId,
      clientId: data.clientId,
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(`${data.startDate}T00:00:00`) : null,
      dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null,
    },
  });

  revalidatePath("/proyectos");
  revalidatePath("/dashboard");
  return { error: null };
}

const updateProjectSchema = createProjectSchema.extend({
  id: z.string().min(1),
  status: z.enum(["ACTIVO", "EN_PAUSA", "COMPLETADO", "CANCELADO"]).optional().default("ACTIVO"),
});

export async function updateProject(formData: FormData) {
  const parsed = updateProjectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const { db } = await getTenantDb();
  await db.project.update({
    where: { id: data.id },
    data: {
      clientId: data.clientId,
      name: data.name,
      status: data.status,
      description: data.description || null,
      startDate: data.startDate ? new Date(`${data.startDate}T00:00:00`) : null,
      dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null,
    },
  });

  revalidatePath("/proyectos");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteProject(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar proyectos — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  const [invoices, events] = await Promise.all([
    db.invoice.count({ where: { projectId: id } }),
    db.event.count({ where: { projectId: id } }),
  ]);
  if (invoices || events) {
    return {
      error: "No se puede eliminar: este proyecto tiene facturas o eventos asociados.",
    };
  }

  // Las tareas del proyecto se eliminan en cascada (ver schema.prisma,
  // Task.project usa onDelete: Cascade).
  await db.project.delete({ where: { id } });
  revalidatePath("/proyectos");
  revalidatePath("/dashboard");
  return { error: null };
}
