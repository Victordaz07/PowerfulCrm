"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { LeadCard, type LeadCardLead } from "./lead-card";
import { updateLeadStage } from "@/app/(dashboard)/crm/actions";

const STAGES = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "GANADO", label: "Ganado" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

interface KanbanLead extends LeadCardLead {
  clientName: string | null;
}

interface KanbanBoardProps {
  initialLeads: KanbanLead[];
  clients: { id: string; name: string }[];
  canDelete: boolean;
}

// Kanban con drag-and-drop real (dnd-kit): el estado de las columnas
// vive en el cliente para que soltar una tarjeta se sienta instantáneo;
// updateLeadStage() persiste el cambio en el servidor y, si falla, la
// tarjeta vuelve a su columna original (rollback optimista).
export function KanbanBoard({ initialLeads, clients, canDelete }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStage = String(over.id) as StageKey;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    const prevStage = lead.stage;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));

    startTransition(async () => {
      const result = await updateLeadStage(leadId, newStage);
      if (result?.error) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: prevStage } : l)));
      }
    });
  }

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.key, leads.filter((l) => l.stage === s.key)])
  ) as Record<StageKey, KanbanLead[]>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.key}
            stageKey={stage.key}
            label={stage.label}
            leads={byStage[stage.key]}
            clients={clients}
            canDelete={canDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  stageKey,
  label,
  leads,
  clients,
  canDelete,
}: {
  stageKey: StageKey;
  label: string;
  leads: KanbanLead[];
  clients: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div className="w-72 flex-shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-content-muted">{label}</span>
        <span className="text-xs text-content-dim">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[60px] space-y-2 rounded-lg p-1 transition-colors duration-fast",
          isOver && "bg-primary-500/10 ring-1 ring-inset ring-primary-500/30"
        )}
      >
        {leads.map((lead, index) => (
          <DraggableLead key={lead.id} lead={lead} index={index} clients={clients} canDelete={canDelete} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-md border border-dashed border-edge p-4 text-center text-xs text-content-dim">
            Sin leads aquí
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableLead({
  lead,
  index,
  clients,
  canDelete,
}: {
  lead: KanbanLead;
  index: number;
  clients: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn("touch-none", isDragging && "relative z-50 opacity-60")}
    >
      <LeadCard lead={lead} clientName={lead.clientName} clients={clients} index={index} canDelete={canDelete} />
    </div>
  );
}
