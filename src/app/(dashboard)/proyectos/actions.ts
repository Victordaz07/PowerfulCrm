"use server";

import { getTenantDb } from "@/lib/tenant";
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
