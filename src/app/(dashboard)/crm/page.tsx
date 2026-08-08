import { getTenantDb } from "@/lib/tenant";
import { isTenantAdmin } from "@/lib/authz";
import Image from "next/image";
import Link from "next/link";
import { NewClientDialog } from "@/components/crm/new-client-dialog";
import { NewLeadDialog } from "@/components/crm/new-lead-dialog";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { EditClientDialog } from "@/components/crm/edit-client-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteClient } from "./actions";

export default async function CrmPage() {
  const { db } = await getTenantDb();
  const [leads, clients, canDelete] = await Promise.all([
    db.lead.findMany({
      where: { stage: { not: "PERDIDO" } },
      include: { client: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.client.findMany({ orderBy: { name: "asc" } }),
    isTenantAdmin(),
  ]);

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));
  const kanbanLeads = leads.map((l) => ({
    id: l.id,
    title: l.title,
    value: l.value ? Number(l.value) : null,
    stage: l.stage,
    source: l.source,
    notes: l.notes,
    clientId: l.clientId,
    clientName: l.client?.name ?? null,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content">Clientes y pipeline</h1>
          <p className="text-sm text-content-muted">Arrastra una tarjeta para cambiarla de etapa.</p>
        </div>
        <div className="flex gap-2">
          <NewClientDialog />
          <NewLeadDialog clients={clientOptions} />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="mb-8 overflow-x-auto rounded-lg border border-edge">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-edge bg-[var(--panel-bg)] text-left text-xs text-content-muted">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="group border-b border-edge last:border-0 hover:bg-surface transition-colors duration-fast"
              >
                <td className="px-4 py-3 font-medium text-content">
                  <Link href={`/crm/${c.id}`} className="hover:text-accent hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-content-muted">{c.email || c.phone || "—"}</td>
                <td className="px-4 py-3 text-content-muted">{c.company || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <EditClientDialog client={c} />
                    {canDelete && (
                      <ConfirmDeleteButton action={deleteClient} id={c.id} itemLabel={c.name} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-content-dim">
                  Aún no tienes clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-edge py-16 text-center">
          <Image
            src="/illustrations/empty-clients.png"
            alt=""
            width={160}
            height={160}
            className="mb-4"
          />
          <p className="text-sm font-medium text-content">Crea tu primer cliente</p>
          <p className="mt-1 max-w-sm text-xs text-content-dim">
            Registra un lead para empezar a mover tu pipeline de ventas.
          </p>
        </div>
      ) : (
        <KanbanBoard initialLeads={kanbanLeads} clients={clientOptions} canDelete={canDelete} />
      )}
    </div>
  );
}
