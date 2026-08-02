"use server";

import { getTenantDb } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  projectId: z.string().optional(),
  type: z.enum(["COTIZACION", "FACTURA"]).optional().default("FACTURA"),
  currency: z.string().min(1).max(6).optional().default("MXN"),
  dueDate: z.string().optional(),
  tax: z.string().optional(),
});

interface ParsedItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

function parseItems(formData: FormData): ParsedItem[] | { error: string } {
  const descriptions = formData.getAll("itemDescription").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const unitPrices = formData.getAll("itemUnitPrice").map(String);

  const items = descriptions
    .map((description, i) => ({
      description: description.trim(),
      quantity: Number(quantities[i] ?? "1"),
      unitPrice: Number(unitPrices[i] ?? "0"),
    }))
    .filter((item) => item.description.length > 0);

  if (items.length === 0) {
    return { error: "Agrega al menos una línea con descripción" };
  }
  if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    return { error: "Las cantidades deben ser números mayores a 0" };
  }
  if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
    return { error: "Los precios unitarios deben ser números válidos" };
  }
  return items;
}

export async function createInvoice(formData: FormData) {
  const parsed = createInvoiceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const items = parseItems(formData);
  if ("error" in items) return items;

  const tax = data.tax ? Number(data.tax) : 0;
  if (!Number.isFinite(tax) || tax < 0) {
    return { error: "El impuesto debe ser un número válido" };
  }
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + tax;

  const { db, tenantId } = await getTenantDb();
  const prefix = data.type === "COTIZACION" ? "COT" : "FAC";
  const existing = await db.invoice.count({ where: { type: data.type } });

  const buildData = (number: string) => ({
    tenantId,
    clientId: data.clientId,
    projectId: data.projectId || null,
    number,
    type: data.type,
    status: "BORRADOR" as const,
    currency: data.currency,
    subtotal,
    tax,
    total,
    dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null,
    items: {
      create: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    },
  });

  try {
    await db.invoice.create({
      data: buildData(`${prefix}-${String(existing + 1).padStart(4, "0")}`),
    });
  } catch (err: unknown) {
    // Folio duplicado por una carrera entre dos creaciones simultáneas —
    // reintenta una vez con el siguiente número antes de rendirse.
    const isUniqueViolation =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
    if (!isUniqueViolation) throw err;
    await db.invoice.create({
      data: buildData(`${prefix}-${String(existing + 2).padStart(4, "0")}`),
    });
  }

  revalidatePath("/facturacion");
  revalidatePath("/dashboard");
  return { error: null };
}
