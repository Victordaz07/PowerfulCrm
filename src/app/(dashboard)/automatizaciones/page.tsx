import { getTenantDb } from "@/lib/tenant";
import { isTenantAdmin } from "@/lib/authz";
import { Zap } from "lucide-react";
import { NewAutomationDialog } from "@/components/automatizaciones/new-automation-dialog";
import { AutomationToggle } from "@/components/automatizaciones/automation-toggle";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteAutomation } from "./actions";

export default async function AutomatizacionesPage() {
  const { db } = await getTenantDb();
  const [rules, canDelete] = await Promise.all([
    db.automationRule.findMany({ orderBy: { createdAt: "desc" } }),
    isTenantAdmin(),
  ]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
          >
            <Zap size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-content">Automatizaciones</h1>
            <p className="text-sm text-content-muted">
              {rules.filter((r) => r.enabled).length} activa{rules.filter((r) => r.enabled).length === 1 ? "" : "s"} de{" "}
              {rules.length}
            </p>
          </div>
        </div>
        <NewAutomationDialog />
      </div>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="group flex items-center gap-4 rounded-2xl border border-edge bg-surface p-5 backdrop-blur-md"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-content">{rule.title}</div>
              {rule.description && (
                <div className="mt-0.5 text-[12.5px] text-content-muted">{rule.description}</div>
              )}
            </div>
            {canDelete && (
              <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <ConfirmDeleteButton action={deleteAutomation} id={rule.id} itemLabel={rule.title} />
              </div>
            )}
            <AutomationToggle id={rule.id} enabled={rule.enabled} />
          </div>
        ))}

        {rules.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge py-16 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
            >
              <Zap size={22} />
            </div>
            <p className="text-sm font-medium text-content">Aún no tienes automatizaciones</p>
            <p className="mt-1 max-w-sm text-xs text-content-dim">
              Crea reglas para que tu negocio trabaje solo. La ejecución automática llega en una fase posterior;
              por ahora puedes definirlas y activarlas.
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-content-dim">
        Nota: las reglas se guardan y administran aquí. La ejecución automática (envíos, recordatorios) se
        conectará vía Inngest en una fase posterior.
      </p>
    </div>
  );
}
