import { inngest } from "./client";
import { rawPrisma } from "@/lib/prisma";
import { Resend } from "resend";

// Instanciado bajo demanda: crearlo a nivel de módulo rompe el build de
// Next.js (y cualquier ruta que importe este archivo) cuando falta
// RESEND_API_KEY, ya que el SDK de Resend lanza en el constructor.
let resend: Resend | undefined;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * Corre todos los días a las 08:00. Recorre TODOS los tenants (por eso
 * usa rawPrisma con tenant_id explícito en el where, en vez del cliente
 * scoped — este es exactamente el caso de uso de sistema/cross-tenant
 * mencionado en lib/tenant.ts).
 */
export const generateRecurringInvoices = inngest.createFunction(
  { id: "generate-recurring-invoices" },
  { cron: "0 8 * * *" },
  async ({ step }) => {
    const dueTemplates = await step.run("find-due-recurring", () =>
      rawPrisma.invoice.findMany({
        where: { isRecurring: true, status: "PAGADA" }, // la última instancia pagada es la plantilla
        include: { items: true },
      })
    );

    for (const tpl of dueTemplates) {
      await step.run(`create-invoice-${tpl.id}`, async () => {
        const count = await rawPrisma.invoice.count({ where: { tenantId: tpl.tenantId } });
        await rawPrisma.invoice.create({
          data: {
            tenantId: tpl.tenantId,
            clientId: tpl.clientId,
            projectId: tpl.projectId,
            number: `FAC-${String(count + 1).padStart(4, "0")}`,
            type: "FACTURA",
            status: "PENDIENTE",
            currency: tpl.currency,
            subtotal: tpl.subtotal,
            tax: tpl.tax,
            total: tpl.total,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            isRecurring: true,
            recurrenceRule: tpl.recurrenceRule,
            items: {
              create: tpl.items.map((i) => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
            },
          },
        });
      });
    }

    return { generated: dueTemplates.length };
  }
);

/** Corre cada hora: marca vencidas y envía recordatorio por email. */
export const remindOverdueInvoices = inngest.createFunction(
  { id: "remind-overdue-invoices" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const overdue = await step.run("mark-overdue", async () => {
      const dueInvoices = await rawPrisma.invoice.findMany({
        where: { status: "PENDIENTE", dueDate: { lt: new Date() } },
        include: { client: true },
      });
      if (dueInvoices.length > 0) {
        await rawPrisma.invoice.updateMany({
          where: { id: { in: dueInvoices.map((i) => i.id) } },
          data: { status: "VENCIDA" },
        });
      }
      return dueInvoices;
    });

    for (const inv of overdue) {
      if (!inv.client.email) continue;
      await step.run(`notify-${inv.id}`, () =>
        getResend().emails.send({
          from: "facturacion@tu-dominio.com",
          to: inv.client.email!,
          subject: `Factura ${inv.number} vencida`,
          text: `Hola ${inv.client.name}, tu factura ${inv.number} venció. Por favor realiza el pago a la brevedad.`,
        })
      );
    }

    return { markedOverdue: overdue.length };
  }
);

/**
 * Corre cada hora: avisa por email de los eventos de calendario que
 * empiezan en la próxima hora. `reminderSentAt` evita reenviar el
 * mismo recordatorio si el cron vuelve a correr sobre el mismo evento.
 */
export const remindUpcomingEvents = inngest.createFunction(
  { id: "remind-upcoming-events" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const upcoming = await step.run("find-upcoming-events", () => {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      return rawPrisma.event.findMany({
        where: {
          startAt: { gte: now, lte: inOneHour },
          reminderSentAt: null,
          status: { not: "CANCELADO" },
        },
        include: { tenant: { include: { users: true } }, client: true },
      });
    });

    for (const event of upcoming) {
      const recipients = event.tenant.users.map((u) => u.email).filter((email): email is string => Boolean(email));
      if (recipients.length === 0) continue;

      await step.run(`notify-${event.id}`, async () => {
        const time = new Date(event.startAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        await getResend().emails.send({
          from: "agenda@tu-dominio.com",
          to: recipients,
          subject: `Recordatorio: ${event.title} a las ${time}`,
          text: [
            `Tu evento "${event.title}" empieza a las ${time}.`,
            event.client ? `Con: ${event.client.name}.` : null,
            event.location ? `Ubicación/link: ${event.location}.` : null,
          ]
            .filter(Boolean)
            .join(" "),
        });
        await rawPrisma.event.update({ where: { id: event.id }, data: { reminderSentAt: new Date() } });
      });
    }

    return { reminded: upcoming.length };
  }
);
