import { inngest } from "./client";
import { rawPrisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";
import { Resend } from "resend";
import { isSameDay } from "date-fns";

// Instanciado bajo demanda: crearlo a nivel de modulo rompe el build de
// Next.js (y cualquier ruta que importe este archivo) cuando falta
// RESEND_API_KEY, ya que el SDK de Resend lanza en el constructor.
let resend: Resend | undefined;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
* Corre todos los dias a las 08:00. Recorre TODOS los tenants (por eso
* usa rawPrisma con tenant_id explicito en el where, en vez del cliente
* scoped, este es exactamente el caso de uso de sistema/cross-tenant
* mencionado en lib/tenant.ts).
*/
export const generateRecurringInvoices = inngest.createFunction(
  { id: "generate-recurring-invoices" },
  { cron: "0 8 * * *" },
  async ({ step }) => {
    const dueTemplates = await step.run("find-due-recurring", () =>
      withDbRetry(() =>
        rawPrisma.invoice.findMany({
          where: { isRecurring: true, status: "PAGADA" }, // la ultima instancia pagada es la plantilla
          include: { items: true },
        })
                  )
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

/** Corre cada hora: marca vencidas y envia recordatorio por email. */
export const remindOverdueInvoices = inngest.createFunction(
  { id: "remind-overdue-invoices" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const overdue = await step.run("mark-overdue", async () => {
      const dueInvoices = await withDbRetry(() =>
        rawPrisma.invoice.findMany({
          where: { status: "PENDIENTE", dueDate: { lt: new Date() } },
          include: { client: true },
        })
                                            );
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
        text: `Hola ${inv.client.name}, tu factura ${inv.number} vencio. Por favor realiza el pago a la brevedad.`,
      })
                   );
  }

  return { markedOverdue: overdue.length };
  }
  );

/**
* Corre cada hora (corrido 5 min para no coincidir con remind-overdue-invoices
* y evitar que ambos crons despierten el compute de Neon al mismo tiempo):
* avisa por email de los eventos de calendario que empiezan en la proxima
* hora. `reminderSentAt` evita reenviar el mismo recordatorio si el cron
* vuelve a correr sobre el mismo evento.
*/
export const remindUpcomingEvents = inngest.createFunction(
  { id: "remind-upcoming-events" },
  { cron: "5 * * * *" },
  async ({ step }) => {
    const upcoming = await step.run("find-upcoming-events", () => {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      return withDbRetry(() =>
        rawPrisma.event.findMany({
          where: {
            startAt: { gte: now, lte: inOneHour },
            reminderSentAt: null,
            status: { not: "CANCELADO" },
          },
          include: { tenant: { include: { users: true } }, client: true },
        })
                         );
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
          event.location ? `Ubicacion/link: ${event.location}.` : null,
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

/**
* Corre todos los dias a las 9am: evalua cada AutomationRule activa (de
* TODOS los tenants) contra su catalogo fijo de tipos y avisa por email
* si encuentra algo. `lastRunAt` marca el dia en que ya se evaluo una
* regla, evita reenviar el mismo aviso si el cron corre mas de una vez
* el mismo dia, pero SI vuelve a avisar al dia siguiente mientras la
* condicion siga vigente (a diferencia de reminderSentAt en Event, que
* es de una sola vez).
*/
export const runAutomationRules = inngest.createFunction(
  { id: "run-automation-rules" },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const rules = await step.run("find-enabled-rules", () =>
      withDbRetry(() =>
        rawPrisma.automationRule.findMany({
          where: { enabled: true },
          include: { tenant: { include: { users: true } } },
        })
                  )
                                 );

  const now = new Date();
    let evaluated = 0;

  for (const rule of rules) {
    if (rule.lastRunAt && isSameDay(new Date(rule.lastRunAt), now)) continue;

    const recipients = rule.tenant.users.map((u) => u.email).filter((email): email is string => Boolean(email));
    if (recipients.length === 0) continue;

    await step.run(`evaluate-${rule.id}`, async () => {
      if (rule.type === "FACTURAS_POR_VENCER") {
        const threshold = new Date(now.getTime() + rule.daysThreshold * 24 * 60 * 60 * 1000);
        const invoices = await rawPrisma.invoice.findMany({
          where: {
            tenantId: rule.tenantId,
            status: { in: ["PENDIENTE", "ENVIADA", "VENCIDA"] },
            dueDate: { not: null, lte: threshold },
          },
          include: { client: true },
          orderBy: { dueDate: "asc" },
        });
        if (invoices.length > 0) {
          await getResend().emails.send({
            from: "automatizaciones@tu-dominio.com",
            to: recipients,
            subject: `${invoices.length} factura${invoices.length === 1 ? "" : "s"} por vencer`,
            text: invoices
            .map((inv) => `${inv.number} - ${inv.client.name} - vence ${new Date(inv.dueDate!).toLocaleDateString("es-MX")}`)
            .join("\n"),
          });
        }
      } else if (rule.type === "LEADS_SIN_SEGUIMIENTO") {
        const staleSince = new Date(now.getTime() - rule.daysThreshold * 24 * 60 * 60 * 1000);
        const leads = await rawPrisma.lead.findMany({
          where: {
            tenantId: rule.tenantId,
            stage: { notIn: ["GANADO", "PERDIDO"] },
            updatedAt: { lte: staleSince },
          },
          orderBy: { updatedAt: "asc" },
        });
        if (leads.length > 0) {
          await getResend().emails.send({
            from: "automatizaciones@tu-dominio.com",
            to: recipients,
            subject: `${leads.length} lead${leads.length === 1 ? "" : "s"} sin seguimiento`,
            text: leads
            .map((l) => `${l.title} - sin novedades desde ${new Date(l.updatedAt).toLocaleDateString("es-MX")}`)
            .join("\n"),
          });
        }
      }

                   await rawPrisma.automationRule.update({ where: { id: rule.id }, data: { lastRunAt: new Date() } });
    });
    evaluated++;
  }

  return { evaluated };
  }
  );
