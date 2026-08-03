"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { EditLeadDialog } from "./edit-lead-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteLead } from "@/app/(dashboard)/crm/actions";

export interface LeadCardLead {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  source: string | null;
  notes: string | null;
  clientId: string | null;
}

interface LeadCardProps {
  lead: LeadCardLead;
  clientName?: string | null;
  clients: { id: string; name: string }[];
  index: number;
  canDelete: boolean;
}

// Tarjeta de lead animada: entra con stagger según su posición en la
// columna y se levanta ligeramente al pasar el mouse. El drag real
// (dnd-kit) envuelve esta tarjeta desde KanbanBoard — aquí solo vive
// la presentación y las acciones de editar/eliminar.
export function LeadCard({ lead, clientName, clients, index, canDelete }: LeadCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, delay: Math.min(index, 6) * 0.03, ease: "easeOut" }}
    >
      <Card className="group cursor-grab hover:border-ink-600 transition-colors duration-fast active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink-100">{lead.title}</p>
            <div className="flex shrink-0 items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <EditLeadDialog lead={lead} clients={clients} />
              {canDelete && (
                <ConfirmDeleteButton action={deleteLead} id={lead.id} itemLabel="lead" iconSize={13} />
              )}
            </div>
          </div>
          <p className="text-xs text-ink-400">{clientName}</p>
          {lead.value ? (
            <p className="mt-2 text-xs font-medium text-primary-400">{formatCurrency(lead.value)}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
