"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createAutomationSchema = z.object({
  title: z.string().min(1, "La descripción es obligatoria").max(200),
  description: z.string().max(500).optional(),
});

export async function createAutomation(formData: FormData) {
  const parsed = createAutomationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const { db, tenantId } = await getTenantDb();
  await db.automationRule.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description || null,
      enabled: true,
    },
  });

  revalidatePath("/automatizaciones");
  return { error: null };
}

// Toggle del switch — mutación mínima de un solo campo.
export async function toggleAutomation(id: string, enabled: boolean) {
  const { db } = await getTenantDb();
  await db.automationRule.update({ where: { id }, data: { enabled } });
  revalidatePath("/automatizaciones");
  return { error: null };
}

export async function deleteAutomation(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar automatizaciones — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  await db.automationRule.delete({ where: { id } });
  revalidatePath("/automatizaciones");
  return { error: null };
}
