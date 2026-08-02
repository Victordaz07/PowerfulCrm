import { getTenantDb } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
import Image from "next/image";

const STAGES = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "GANADO", label: "Ganado" },
] as const;

export default async function CrmPage() {
  const { db } = await getTenantDb();
  const leads = await db.lead.findMany({
    where: { stage: { not: "PERDIDO" } },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.key, leads.filter((l) => l.stage === s.key)])
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-50">Clientes y pipeline</h1>
          <p className="text-sm text-ink-400">Arrastra una tarjeta para cambiarla de etapa.</p>
        </div>
        <Button size="sm">
          <Plus size={14} /> Nuevo lead
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-800 py-16 text-center">
          <Image
            src="/illustrations/empty-clients.png"
            alt=""
            width={160}
            height={160}
            className="mb-4"
          />
          <p className="text-sm font-medium text-ink-100">Crea tu primer cliente</p>
          <p className="mt-1 max-w-sm text-xs text-ink-500">
            Registra un lead para empezar a mover tu pipeline de ventas.
          </p>
        </div>
      ) : (
        /* Nota de implementación: el drag-and-drop real se conecta con
           dnd-kit + una mutación optimista de TanStack Query que actualiza
           la caché al instante y hace rollback si el servidor falla.
           Este componente de servidor renderiza el estado inicial;
           la interactividad vive en un client component hermano. */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className="w-72 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  {stage.label}
                </span>
                <span className="text-xs text-ink-500">{byStage[stage.key].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage.key].map((lead) => (
                  <Card key={lead.id} className="cursor-grab hover:border-ink-600 transition-colors duration-fast">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-ink-100">{lead.title}</p>
                      <p className="text-xs text-ink-400">{lead.client?.name}</p>
                      {lead.value && (
                        <p className="mt-2 text-xs font-medium text-amber-400">
                          {formatCurrency(Number(lead.value))}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {byStage[stage.key].length === 0 && (
                  <div className="rounded-md border border-dashed border-ink-800 p-4 text-center text-xs text-ink-500">
                    Sin leads aquí
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
