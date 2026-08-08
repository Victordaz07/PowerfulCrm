"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";

const MAX_RESOURCE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function revalidateClientDetail(clientId: string) {
  revalidatePath(`/crm/${clientId}`);
  revalidatePath("/crm");
}

// ── Contratos ────────────────────────────────────────────────────
const CONTRACT_STATES = ["BORRADOR", "ACTIVO", "FINALIZADO", "CANCELADO"] as const;

const createContractSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1, "El título es obligatorio").max(160),
  status: z.enum(CONTRACT_STATES).optional().default("BORRADOR"),
  value: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

function parseValue(raw?: string): number | null | { error: string } {
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return { error: "El valor debe ser un número válido" };
  return n;
}

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createContract(formData: FormData) {
  const parsed = createContractSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const value = parseValue(data.value);
  if (value && typeof value === "object") return value;

  const { db, tenantId } = await getTenantDb();
  await db.contract.create({
    data: {
      tenantId,
      clientId: data.clientId,
      title: data.title,
      status: data.status,
      value: value as number | null,
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      notes: data.notes || null,
    },
  });

  revalidateClientDetail(data.clientId);
  return { error: null };
}

const updateContractSchema = createContractSchema.extend({ id: z.string().min(1) });

export async function updateContract(formData: FormData) {
  const parsed = updateContractSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const value = parseValue(data.value);
  if (value && typeof value === "object") return value;

  const { db } = await getTenantDb();
  await db.contract.update({
    where: { id: data.id },
    data: {
      title: data.title,
      status: data.status,
      value: value as number | null,
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      notes: data.notes || null,
    },
  });

  revalidateClientDetail(data.clientId);
  return { error: null };
}

export async function deleteContract(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar contratos — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  // Lee el clientId (bajo RLS) antes de borrar, para revalidar su detalle.
  const contract = await db.contract.findUnique({ where: { id }, select: { clientId: true } });
  await db.contract.delete({ where: { id } });
  if (contract) revalidateClientDetail(contract.clientId);
  return { error: null };
}

// ── Recursos ─────────────────────────────────────────────────────
const createResourceSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  // z.string().url() valida el formato pero no el protocolo — sin el
  // refine, algo como "javascript:alert(1)" pasaría y luego se
  // renderiza en un <a href> real en crm/[id]/page.tsx (XSS almacenado).
  url: z
    .string()
    .url("El enlace debe ser una URL válida")
    .refine((val) => /^https?:\/\//i.test(val), "El enlace debe empezar con http:// o https://")
    .optional()
    .or(z.literal("")),
});

export async function createResource(formData: FormData) {
  const parsed = createResourceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  let url = data.url || null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_RESOURCE_FILE_BYTES) {
      return { error: "El archivo no puede pesar más de 10 MB" };
    }
    const blob = await put(`resources/${data.clientId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    url = blob.url;
    mimeType = file.type || null;
    sizeBytes = file.size;
  }

  const { db, tenantId } = await getTenantDb();
  await db.resource.create({
    data: {
      tenantId,
      clientId: data.clientId,
      name: data.name,
      url,
      mimeType,
      sizeBytes,
    },
  });

  revalidateClientDetail(data.clientId);
  return { error: null };
}

export async function deleteResource(id: string) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar recursos — se requiere rol de administrador." };
  }

  const { db } = await getTenantDb();
  const resource = await db.resource.findUnique({ where: { id }, select: { clientId: true } });
  await db.resource.delete({ where: { id } });
  if (resource) revalidateClientDetail(resource.clientId);
  return { error: null };
}
