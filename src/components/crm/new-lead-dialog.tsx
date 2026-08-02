"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";
import { createLead } from "@/app/(dashboard)/crm/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

const STAGE_OPTIONS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { value: "NEGOCIACION", label: "Negociación" },
  { value: "GANADO", label: "Ganado" },
];

interface NewLeadDialogProps {
  clients: { id: string; name: string }[];
}

export function NewLeadDialog({ clients }: NewLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLead(formData);
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
        <Button size="sm">
          <Plus size={14} /> Nuevo lead
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Nuevo lead
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass}>Título de la oportunidad</label>
              <input name="title" required maxLength={120} className={inputClass} placeholder="Rediseño de marca" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Valor estimado (opcional)</label>
                <input name="value" inputMode="decimal" className={inputClass} placeholder="15000" />
              </div>
              <div>
                <label className={labelClass}>Etapa</label>
                <select name="stage" defaultValue="NUEVO" className={inputClass}>
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {clients.length > 0 && (
              <div>
                <label className={labelClass}>Cliente (opcional)</label>
                <select name="clientId" defaultValue="" className={inputClass}>
                  <option value="">— Ninguno —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Fuente (opcional)</label>
              <input name="source" className={inputClass} placeholder="Referido, sitio web, LinkedIn…" />
            </div>
            <div>
              <label className={labelClass}>Notas (opcional)</label>
              <textarea name="notes" rows={2} className={inputClass} />
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
                {isPending ? "Guardando…" : "Crear lead"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
