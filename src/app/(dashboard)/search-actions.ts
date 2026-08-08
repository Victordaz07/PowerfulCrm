"use server";

import { getTenantDb } from "@/lib/tenant";

export interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  group: "Clientes" | "Facturas" | "Proyectos" | "Leads";
}

// Búsqueda global del ⌘K del header: cliente, factura, proyecto o
// lead cuyo nombre/folio/título coincida. No hay páginas de detalle
// por entidad todavía, así que cada resultado navega a la sección
// (Clientes/Facturación/Proyectos) donde vive ese registro.
export async function searchGlobal(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { db } = await getTenantDb();
  const insensitive = { contains: q, mode: "insensitive" as const };

  const [clients, invoices, projects, leads] = await Promise.all([
    db.client.findMany({
      where: { OR: [{ name: insensitive }, { email: insensitive }, { company: insensitive }] },
      take: 5,
      select: { id: true, name: true, company: true },
    }),
    db.invoice.findMany({
      where: { OR: [{ number: insensitive }, { client: { name: insensitive } }] },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
    db.project.findMany({
      where: { name: insensitive },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
    db.lead.findMany({
      where: { title: insensitive },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return [
    ...clients.map((c) => ({
      id: `client-${c.id}`,
      label: c.name,
      sublabel: c.company ?? undefined,
      href: "/crm",
      group: "Clientes" as const,
    })),
    ...invoices.map((inv) => ({
      id: `invoice-${inv.id}`,
      label: inv.number,
      sublabel: inv.client.name,
      href: "/facturacion",
      group: "Facturas" as const,
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      sublabel: p.client.name,
      href: "/proyectos",
      group: "Proyectos" as const,
    })),
    ...leads.map((l) => ({
      id: `lead-${l.id}`,
      label: l.title,
      sublabel: l.client?.name,
      href: "/crm",
      group: "Leads" as const,
    })),
  ];
}
