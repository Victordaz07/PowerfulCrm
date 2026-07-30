import { getTenantDb } from "@/lib/tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const { db } = await getTenantDb();

  const [pendingInvoices, overdueInvoices, activeProjects, overdueTasks, paidThisMonth] =
    await Promise.all([
      db.invoice.count({ where: { status: "PENDIENTE" } }),
      db.invoice.count({ where: { status: "VENCIDA" } }),
      db.project.count({ where: { status: "ACTIVO" } }),
      db.task.count({ where: { dueDate: { lt: new Date() }, status: { not: "COMPLETADA" } } }),
      db.invoice.aggregate({
        _sum: { total: true },
        where: { status: "PAGADA", paidAt: { gte: new Date(new Date().setDate(1)) } },
      }),
    ]);

  const metrics = [
    { label: "Ingresos este mes", value: formatCurrency(Number(paidThisMonth._sum.total ?? 0)) },
    { label: "Facturas pendientes", value: pendingInvoices, tone: "warning" as const },
    { label: "Facturas vencidas", value: overdueInvoices, tone: "danger" as const },
    { label: "Proyectos activos", value: activeProjects },
    { label: "Tareas vencidas", value: overdueTasks, tone: "danger" as const },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink-50">Resumen</h1>
      <p className="mb-6 text-sm text-ink-400">Así va tu negocio hoy.</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent>
              <p className="text-xs text-ink-400">{m.label}</p>
              <p
                className={
                  "mt-1 text-2xl font-semibold " +
                  (m.tone === "danger"
                    ? "text-danger"
                    : m.tone === "warning"
                    ? "text-amber-400"
                    : "text-ink-50")
                }
              >
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
