"use server";

import { getTenantDb } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
});

export async function createClient(formData: FormData) {
  const parsed = createClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const { db, tenantId } = await getTenantDb();
  await db.client.create({
    data: {
      tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/proyectos");
  revalidatePath("/facturacion");
  revalidatePath("/calendario");
  return { error: null };
}

const createLeadSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(120),
  value: z.string().optional(),
  stage: z
    .enum(["NUEVO", "CONTACTADO", "PROPUESTA_ENVIADA", "NEGOCIACION", "GANADO"])
    .optional()
    .default("NUEVO"),
  source: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  clientId: z.string().optional(),
});

export async function createLead(formData: FormData) {
  const parsed = createLeadSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  let value: number | null = null;
  if (data.value) {
    const n = Number(data.value);
    if (Number.isNaN(n) || n < 0) return { error: "El valor debe ser un número válido" };
    value = n;
  }

  const { db, tenantId } = await getTenantDb();
  await db.lead.create({
    data: {
      tenantId,
      title: data.title,
      value,
      stage: data.stage,
      source: data.source || null,
      notes: data.notes || null,
      clientId: data.clientId || null,
    },
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return { error: null };
}
