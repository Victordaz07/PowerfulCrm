"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil } from "lucide-react";
import { updateLead } from "@/app/(dashboard)/crm/actions";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

const STAGES = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "GANADO", label: "Ganado" },
  { key: "PERDIDO", label: "Perdido" },
] as const;

interface EditLeadDialogProps {
  lead: {
    id: string;
    title: string;
    value: number | null;
    stage: string;
    source: string | null;
    notes: string | null;
    clientId: string | null;
  };
  clients: { id: string; name: string }[];
}

export function EditLeadDialog({ lead, clients }: EditLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateLead(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-ink-500 transition-colors hover:text-ink-100"
          aria-label={`Editar ${lead.title}`}
        >
          <Pencil size={13} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Editar lead
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="id" value={lead.id} />
            <div>
              <label className={labelClass}>Título</label>
              <input name="title" required maxLength={120} defaultValue={lead.title} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Valor (opcional)</label>
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={lead.value ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Etapa</label>
                <select name="stage" defaultValue={lead.stage} className={inputClass}>
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Cliente (opcional)</label>
              <select name="clientId" defaultValue={lead.clientId ?? ""} className={inputClass}>
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fuente (opcional)</label>
              <input name="source" defaultValue={lead.source ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notas (opcional)</label>
              <textarea name="notes" rows={3} defaultValue={lead.notes ?? ""} className={inputClass} />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-lg px-3 py-2 text-sm text-ink-400 hover:text-ink-100">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400 disabled:opacity-50"
              >
                {isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
