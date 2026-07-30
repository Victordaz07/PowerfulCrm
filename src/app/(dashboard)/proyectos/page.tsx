import { getTenantDb } from "@/lib/tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function ProyectosPage() {
  const { db } = await getTenantDb();
  const projects = await db.project.findMany({
    where: { status: "ACTIVO" },
    include: { client: true, tasks: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-50">Proyectos</h1>
          <p className="text-sm text-ink-400">{projects.length} proyectos activos</p>
        </div>
        <Button size="sm">
          <Plus size={14} /> Nuevo proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-800 p-12 text-center">
          <p className="text-sm text-ink-300">Aún no tienes proyectos activos.</p>
          <p className="mt-1 text-xs text-ink-500">
            Crea uno desde la ficha de un cliente para empezar a asignar tareas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const done = p.tasks.filter((t) => t.status === "COMPLETADA").length;
            const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
            return (
              <Card key={p.id}>
                <CardHeader>
                  <p className="text-sm font-medium text-ink-50">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.client.name}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 h-1.5 w-full rounded-full bg-ink-800">
                    <div
                      className="h-1.5 rounded-full bg-amber-500 transition-all duration-fast"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span>{done}/{p.tasks.length} tareas</span>
                    {p.dueDate && <span>Entrega {formatDate(p.dueDate)}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
