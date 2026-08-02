import { getTenantDb } from "@/lib/tenant";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { IncomeTrendChart } from "@/components/dashboard/income-trend-chart";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { MiniSparkline } from "@/components/dashboard/mini-sparkline";
import { UpcomingTimeline, type UpcomingItem } from "@/components/dashboard/upcoming-timeline";
import { RecentInvoicesTable, type RecentInvoiceRow } from "@/components/dashboard/recent-invoices-table";
import { Wallet, FileText, KanbanSquare } from "lucide-react";
import { format, startOfMonth, subMonths, startOfWeek, subWeeks } from "date-fns";
import { es } from "date-fns/locale";

const CURRENCY = "MXN";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function DashboardPage() {
  const { db } = await getTenantDb();
  const now = new Date();
  const startThisMonth = startOfMonth(now);
  const startLastMonth = startOfMonth(subMonths(now, 1));
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const sixWeeksAgo = startOfWeek(subWeeks(now, 5), { weekStartsOn: 1 });

  const [
    pendingInvoices,
    overdueInvoices,
    activeProjects,
    overdueTasks,
    paidThisMonthAgg,
    paidLastMonthAgg,
    totalInvoicesCount,
    paidInvoicesCount,
    totalProjectsCount,
    completedProjectsCount,
    paidInvoicesForTrend,
    tasksForTimeline,
    invoicesForTimeline,
    recentLeads,
    recentInvoices,
  ] = await Promise.all([
    db.invoice.count({ where: { status: "PENDIENTE" } }),
    db.invoice.count({ where: { status: "VENCIDA" } }),
    db.project.count({ where: { status: "ACTIVO" } }),
    db.task.count({ where: { dueDate: { lt: now }, status: { not: "COMPLETADA" } } }),
    db.invoice.aggregate({
      _sum: { total: true },
      where: { status: "PAGADA", paidAt: { gte: startThisMonth } },
    }),
    db.invoice.aggregate({
      _sum: { total: true },
      where: { status: "PAGADA", paidAt: { gte: startLastMonth, lt: startThisMonth } },
    }),
    db.invoice.count(),
    db.invoice.count({ where: { status: "PAGADA" } }),
    db.project.count(),
    db.project.count({ where: { status: "COMPLETADO" } }),
    db.invoice.findMany({
      where: { status: "PAGADA", paidAt: { gte: sixMonthsAgo } },
      select: { total: true, paidAt: true },
    }),
    db.task.findMany({
      where: { status: { not: "COMPLETADA" }, dueDate: { not: null } },
      include: { project: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.invoice.findMany({
      where: { status: { in: ["PENDIENTE", "ENVIADA", "VENCIDA"] }, dueDate: { not: null } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.lead.findMany({
      where: { createdAt: { gte: sixWeeksAgo } },
      select: { createdAt: true },
    }),
    db.invoice.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // ── Ingresos del mes + variación vs. mes anterior ──────────────
  const paidThisMonth = Number(paidThisMonthAgg._sum.total ?? 0);
  const paidLastMonth = Number(paidLastMonthAgg._sum.total ?? 0);

  let monthlyTrend: { value: string; direction: "up" | "down"; tone: "success" | "danger" | "neutral" } | undefined;
  let monthlyHint: string | undefined;
  if (paidLastMonth > 0) {
    const pct = ((paidThisMonth - paidLastMonth) / paidLastMonth) * 100;
    monthlyTrend = {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs mes anterior`,
      direction: pct >= 0 ? "up" : "down",
      tone: pct >= 0 ? "success" : "danger",
    };
  } else if (paidThisMonth > 0) {
    monthlyHint = "Primer mes con ingresos registrados";
  } else {
    monthlyHint = "Aún sin ingresos registrados";
  }

  // ── Rings de progreso ───────────────────────────────────────────
  const paidRatio = totalInvoicesCount > 0 ? Math.round((paidInvoicesCount / totalInvoicesCount) * 100) : 0;
  const completedRatio =
    totalProjectsCount > 0 ? Math.round((completedProjectsCount / totalProjectsCount) * 100) : 0;

  // ── Tendencia de ingresos (últimos 6 meses) + sparkline de facturas pagadas ──
  const monthBuckets = Array.from({ length: 6 }, (_, idx) => {
    const d = startOfMonth(subMonths(now, 5 - idx));
    return { key: d.toISOString(), label: capitalize(format(d, "MMM", { locale: es })), total: 0, count: 0 };
  });
  for (const inv of paidInvoicesForTrend) {
    if (!inv.paidAt) continue;
    const key = startOfMonth(inv.paidAt).toISOString();
    const bucket = monthBuckets.find((b) => b.key === key);
    if (bucket) {
      bucket.total += Number(inv.total);
      bucket.count += 1;
    }
  }
  const revenueTrend = monthBuckets.map((b) => ({ month: b.label, total: Math.round(b.total) }));
  const paidInvoicesSpark = monthBuckets.map((b) => ({ label: b.label, value: b.count }));

  // ── Sparkline de leads nuevos por semana (últimas 6 semanas) ────
  const weekBuckets = Array.from({ length: 6 }, (_, idx) => {
    const d = startOfWeek(subWeeks(now, 5 - idx), { weekStartsOn: 1 });
    return { key: d.toISOString(), label: capitalize(format(d, "d MMM", { locale: es })), value: 0 };
  });
  for (const lead of recentLeads) {
    const key = startOfWeek(lead.createdAt, { weekStartsOn: 1 }).toISOString();
    const bucket = weekBuckets.find((b) => b.key === key);
    if (bucket) bucket.value += 1;
  }
  const newLeadsSpark = weekBuckets.map((b) => ({ label: b.label, value: b.value }));

  // ── Próximos compromisos: tareas + facturas por vencer, vencidos primero ──
  type Ranked = { date: Date; item: UpcomingItem };
  const ranked: Ranked[] = [];

  for (const task of tasksForTimeline) {
    if (!task.dueDate) continue;
    const isPast = task.dueDate < now;
    ranked.push({
      date: task.dueDate,
      item: {
        id: `task-${task.id}`,
        title: task.title,
        subtitle: task.project?.name
          ? `${isPast ? "Venció" : "Vence"} · ${task.project.name}`
          : isPast
            ? "Venció"
            : "Vence",
        date: formatDate(task.dueDate),
        tone: isPast ? "danger" : "neutral",
      },
    });
  }

  for (const inv of invoicesForTimeline) {
    if (!inv.dueDate) continue;
    const isPast = inv.dueDate < now;
    ranked.push({
      date: inv.dueDate,
      item: {
        id: `invoice-${inv.id}`,
        title: `Factura ${inv.number}`,
        subtitle: `${isPast ? "Venció" : "Vence"} · ${inv.client.name}`,
        date: formatDate(inv.dueDate),
        tone: isPast ? "danger" : "primary",
      },
    });
  }

  const upcomingItems = ranked.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5).map((r) => r.item);

  // ── Facturas recientes ───────────────────────────────────────────
  const recentInvoiceRows: RecentInvoiceRow[] = recentInvoices.map((inv) => ({
    id: inv.id,
    clientName: inv.client.name,
    number: inv.number,
    date: inv.createdAt,
    total: Number(inv.total),
    currency: inv.currency,
    status: inv.status,
  }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-50">Resumen</h1>
        <p className="text-sm text-ink-400">Así va tu negocio hoy.</p>
      </div>

      {/* Hero stat strip */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(paidThisMonth, CURRENCY)}
          icon={Wallet}
          iconTone="success"
        />
        <StatCard
          label="Facturas pendientes"
          value={`${pendingInvoices} activas`}
          icon={FileText}
          iconTone="primary"
        />
        <StatCard
          label="Proyectos activos"
          value={`${activeProjects} activos`}
          icon={KanbanSquare}
          iconTone="neutral"
        />
      </section>

      {/* Tendencia de ingresos */}
      <section className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-6 backdrop-blur-md">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink-50">Tendencia de ingresos</h2>
            <p className="mt-0.5 text-xs text-ink-400">Facturas cobradas por mes · últimos 6 meses</p>
          </div>
        </div>
        <IncomeTrendChart data={revenueTrend} currency={CURRENCY} />
      </section>

      {/* Dense stat row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Ingreso mensual" value={formatCurrency(paidThisMonth, CURRENCY)} trend={monthlyTrend} hint={monthlyHint} />
        <StatCard label="Facturas pendientes" value={`${pendingInvoices} activas`} hint="Sin cobrar todavía" />
        <StatCard
          label="Facturas vencidas"
          value={`${overdueInvoices} facturas`}
          valueTone={overdueInvoices > 0 ? "danger" : "default"}
          hint={overdueInvoices > 0 ? "Requieren seguimiento" : "Todo al día"}
        />
        <StatCard label="Proyectos activos" value={`${activeProjects} activos`} hint={`${totalProjectsCount} en total`} />
        <StatCard
          label="Tareas vencidas"
          value={`${overdueTasks} tarea${overdueTasks === 1 ? "" : "s"}`}
          valueTone={overdueTasks > 0 ? "danger" : "default"}
          hint={overdueTasks > 0 ? "Prioridad alta" : "Sin pendientes"}
        />
      </section>

      {/* Timeline + métricas secundarias */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-6 backdrop-blur-md lg:col-span-5">
          <h3 className="mb-6 text-sm font-semibold text-ink-50">Próximos compromisos</h3>
          <UpcomingTimeline items={upcomingItems} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          <div className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-5 backdrop-blur-md">
            <h4 className="mb-1 text-sm font-medium text-ink-50">Facturas pagadas</h4>
            <p className="mb-4 text-xs text-ink-400">
              {paidInvoicesCount} de {totalInvoicesCount} facturas totales
            </p>
            <div className="flex items-center justify-center">
              <ProgressRing percent={paidRatio} label="Facturas pagadas" tone="amber" />
            </div>
          </div>
          <div className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-5 backdrop-blur-md">
            <h4 className="mb-1 text-sm font-medium text-ink-50">Proyectos completados</h4>
            <p className="mb-4 text-xs text-ink-400">
              {completedProjectsCount} de {totalProjectsCount} proyectos totales
            </p>
            <div className="flex items-center justify-center">
              <ProgressRing percent={completedRatio} label="Proyectos completados" tone="success" />
            </div>
          </div>
          <div className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-5 backdrop-blur-md">
            <h4 className="mb-1 text-sm font-medium text-ink-50">Facturas pagadas por mes</h4>
            <p className="mb-2 text-xs text-ink-400">Últimos 6 meses</p>
            <MiniSparkline data={paidInvoicesSpark} tone="success" />
          </div>
          <div className="rounded-2xl border border-ink-800/60 bg-ink-900/70 p-5 backdrop-blur-md">
            <h4 className="mb-1 text-sm font-medium text-ink-50">Leads nuevos</h4>
            <p className="mb-2 text-xs text-ink-400">Por semana</p>
            <MiniSparkline data={newLeadsSpark} tone="amber" />
          </div>
        </div>
      </section>

      {/* Facturas recientes */}
      <section className="rounded-2xl border border-ink-800/60 bg-ink-900/70 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-ink-800/60 px-6 py-5">
          <h3 className="text-sm font-semibold text-ink-50">Facturas recientes</h3>
          <a href="/facturacion" className="text-xs text-ink-400 hover:text-ink-100">
            Ver todas
          </a>
        </div>
        <RecentInvoicesTable rows={recentInvoiceRows} />
      </section>
    </div>
  );
}
