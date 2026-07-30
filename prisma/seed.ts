import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Estudio Demo", slug: "demo", country: "MX", currency: "MXN" },
  });

  const cliente = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Café Andina",
      email: "hola@cafeandina.mx",
      company: "Café Andina S.A.",
      tags: ["retail", "branding"],
    },
  });

  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      clientId: cliente.id,
      title: "Rediseño de identidad de marca",
      value: 45000,
      stage: "PROPUESTA_ENVIADA",
    },
  });

  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      clientId: cliente.id,
      name: "Rediseño de marca — Café Andina",
      status: "ACTIVO",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.createMany({
    data: [
      { tenantId: tenant.id, projectId: project.id, title: "Moodboard inicial", status: "COMPLETADA", position: 0 },
      { tenantId: tenant.id, projectId: project.id, title: "Propuesta de logotipo", status: "EN_PROGRESO", position: 1 },
      { tenantId: tenant.id, projectId: project.id, title: "Manual de marca", status: "PENDIENTE", position: 2 },
    ],
  });

  await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      clientId: cliente.id,
      projectId: project.id,
      number: "FAC-0001",
      type: "FACTURA",
      status: "PENDIENTE",
      currency: "MXN",
      subtotal: 45000,
      tax: 7200,
      total: 52200,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ description: "Diseño de identidad de marca", quantity: 1, unitPrice: 45000 }],
      },
    },
  });

  console.log("Seed listo. Tenant demo:", tenant.slug);
}

main().finally(() => prisma.$disconnect());
