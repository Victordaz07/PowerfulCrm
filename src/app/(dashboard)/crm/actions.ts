"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function revalidateClientViews() {
  revalidatePath("/crm");
  revalidatePath("/proyectos");
  revalidatePath("/facturacion");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}

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

  revalidateClientViews();
  return { error: null };
}

const updateClientSchema = createClientSchema.extend({
  id: z.string().min(1),
});

export async function updateClient(formData: FormData) {
  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const { db } = await getTenantDb();
  await db.client.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
    },
  });

  revalidateClientViews();
  return { error: null };
}

export async function deleteClient(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar clientes — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  const [projects, invoices, leads, events] = await Promise.all([
    db.project.count({ where: { clientId: id } }),
    db.invoice.count({ where: { clientId: id } }),
    db.lead.count({ where: { clientId: id } }),
    db.event.count({ where: { clientId: id } }),
  ]);
  if (projects || invoices || leads || events) {
    return {
      error:
        "No se puede eliminar: este cliente tiene proyectos, facturas, leads o eventos asociados.",
    };
  }

  await db.client.delete({ where: { id } });
  revalidateClientViews();
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

const LEAD_STAGES = ["NUEVO", "CONTACTADO", "PROPUESTA_ENVIADA", "NEGOCIACION", "GANADO", "PERDIDO"] as const;

const updateLeadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "El título es obligatorio").max(120),
  value: z.string().optional(),
  stage: z.enum(LEAD_STAGES).optional().default("NUEVO"),
  source: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  clientId: z.string().optional(),
});

export async function updateLead(formData: FormData) {
  const parsed = updateLeadSchema.safeParse(Object.fromEntries(formData.entries()));
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

  const { db } = await getTenantDb();
  await db.lead.update({
    where: { id: data.id },
    data: {
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

// Usado por el drag-and-drop del Kanban: mutación mínima de una sola
// columna (stage), sin pasar por el formulario completo de edición.
export async function updateLeadStage(id: string, stage: (typeof LEAD_STAGES)[number]) {
  if (!LEAD_STAGES.includes(stage)) return { error: "Etapa inválida" };

  const { db } = await getTenantDb();
  await db.lead.update({ where: { id }, data: { stage } });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteLead(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar leads — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  const events = await db.event.count({ where: { leadId: id } });
  if (events) {
    return { error: "No se puede eliminar: este lead tiene eventos de calendario asociados." };
  }

  await db.lead.delete({ where: { id } });
  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return { error: null };
}
