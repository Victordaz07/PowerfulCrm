"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(120),
  type: z.enum(["REUNION", "LLAMADA", "ENTREGA", "RECORDATORIO", "OTRO"]),
  date: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.coerce.boolean().optional().default(false),
  location: z.string().optional(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  leadId: z.string().optional(),
});

export async function createEvent(formData: FormData) {
  const parsed = createEventSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const startAt = data.allDay
    ? new Date(`${data.date}T00:00:00`)
    : new Date(`${data.date}T${data.startTime || "09:00"}:00`);
  const endAt = data.allDay
    ? new Date(`${data.date}T23:59:59`)
    : new Date(`${data.date}T${data.endTime || "10:00"}:00`);

  if (endAt <= startAt) {
    return { error: "La hora de fin debe ser después de la hora de inicio" };
  }

  const { db, tenantId } = await getTenantDb();
  await db.event.create({
    data: {
      tenantId,
      title: data.title,
      type: data.type,
      startAt,
      endAt,
      allDay: data.allDay,
      location: data.location || null,
      description: data.description || null,
      clientId: data.clientId || null,
      projectId: data.projectId || null,
      leadId: data.leadId || null,
    },
  });

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteEvent(id: string) {
  // Única acción destructiva que existe hoy en la app — se restringe a
  // admins/owner del tenant. El resto de las Server Actions (crear
  // cliente/lead/proyecto/factura/evento) quedan abiertas a cualquier
  // miembro a propósito, ver src/lib/authz.ts.
  await requireTenantAdmin();

  const { db } = await getTenantDb();
  await db.event.delete({ where: { id } });
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}
