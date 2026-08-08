"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Pencil } from "lucide-react";
import { createContract, updateContract } from "@/app/(dashboard)/crm/[id]/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface-strong px-3 py-2 text-sm text-content focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-content-muted";

const STATUSES = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export interface ContractDTO {
  id: string;
  title: string;
  status: string;
  value: number | null;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  notes: string | null;
}

interface ContractDialogProps {
  clientId: string;
  contract?: ContractDTO;
}

export function ContractDialog({ clientId, contract }: ContractDialogProps) {
  const isEdit = !!contract;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateContract(formData) : await createContract(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(n) => { setOpen(n); if (!n) setError(null); }}>
      <Dialog.Trigger asChild>
        {isEdit ? (
          <button
            type="button"
            className="text-content-dim transition-colors hover:text-content"
            aria-label={`Editar ${contract!.title}`}
          >
            <Pencil size={14} />
          </button>
        ) : (
          <Button size="sm" variant="secondary">
            <Plus size={14} /> Nuevo contrato
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-edge bg-[var(--panel-bg)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-content">
              {isEdit ? "Editar contrato" : "Nuevo contrato"}
            </Dialog.Title>
            <Dialog.Close className="text-content-dim hover:text-content">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="clientId" value={clientId} />
            {isEdit && <input type="hidden" name="id" value={contract!.id} />}

            <div>
              <label className={labelClass}>Título</label>
              <input
                name="title"
                required
                maxLength={160}
                defaultValue={contract?.title}
                className={inputClass}
                placeholder="Contrato de diseño web"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Estado</label>
                <select name="status" defaultValue={contract?.status ?? "BORRADOR"} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Valor (opcional)</label>
                <input
                  type="number"
                  name="value"
                  min={0}
                  step="0.01"
                  defaultValue={contract?.value ?? undefined}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Inicio (opcional)</label>
                <input type="date" name="startDate" defaultValue={contract?.startDate ?? undefined} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fin (opcional)</label>
                <input type="date" name="endDate" defaultValue={contract?.endDate ?? undefined} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Notas (opcional)</label>
              <textarea name="notes" rows={3} defaultValue={contract?.notes ?? undefined} className={inputClass} />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-lg px-3 py-2 text-sm text-content-muted hover:text-content">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400 disabled:opacity-50"
              >
                {isPending ? "Guardando…" : isEdit ? "Guardar" : "Crear contrato"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
