import { getTenantDb } from "@/lib/tenant";
import { isTenantAdmin } from "@/lib/authz";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { NewProjectDialog } from "@/components/proyectos/new-project-dialog";
import { EditProjectDialog } from "@/components/proyectos/edit-project-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteProject } from "./actions";

function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function ProyectosPage() {
  const { db } = await getTenantDb();
  const [projects, clients, canDelete] = await Promise.all([
    db.project.findMany({
      where: { status: "ACTIVO" },
      include: { client: true, tasks: true },
      orderBy: { createdAt: "desc" },
    }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    isTenantAdmin(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content">Proyectos</h1>
          <p className="text-sm text-content-muted">{projects.length} proyectos activos</p>
        </div>
        <NewProjectDialog clients={clients} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-edge py-16 text-center">
          <Image
            src="/illustrations/empty-projects.png"
            alt=""
            width={160}
            height={160}
            className="mb-4"
          />
          <p className="text-sm text-content-muted">Aún no tienes proyectos activos.</p>
          <p className="mt-1 text-xs text-content-dim">
            Crea uno desde la ficha de un cliente para empezar a asignar tareas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const done = p.tasks.filter((t) => t.status === "COMPLETADA").length;
            const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
            return (
              <Card key={p.id} className="group">
                <CardHeader className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-content">{p.name}</p>
                    <p className="text-xs text-content-muted">{p.client.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <EditProjectDialog
                      project={{
                        id: p.id,
                        name: p.name,
                        clientId: p.clientId,
                        status: p.status,
                        description: p.description,
                        startDate: toDateInput(p.startDate),
                        dueDate: toDateInput(p.dueDate),
                      }}
                      clients={clients}
                    />
                    {canDelete && (
                      <ConfirmDeleteButton action={deleteProject} id={p.id} itemLabel={p.name} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 h-1.5 w-full rounded-full bg-surface-strong">
                    <div
                      className="h-1.5 rounded-full bg-primary-500 transition-all duration-fast"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-content-muted">
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
