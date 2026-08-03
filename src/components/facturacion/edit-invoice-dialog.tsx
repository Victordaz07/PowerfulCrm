"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil } from "lucide-react";
import { updateInvoice } from "@/app/(dashboard)/facturacion/actions";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

const STATUSES = [
  { key: "BORRADOR", label: "Borrador" },
  { key: "ENVIADA", label: "Enviada" },
  { key: "PENDIENTE", label: "Pendiente" },
  { key: "PAGADA", label: "Pagada" },
  { key: "VENCIDA", label: "Vencida" },
  { key: "CANCELADA", label: "Cancelada" },
] as const;

interface EditInvoiceDialogProps {
  invoice: {
    id: string;
    number: string;
    clientId: string;
    projectId: string | null;
    status: string;
    dueDate: string | null;
  };
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

export function EditInvoiceDialog({ invoice, clients, projects }: EditInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateInvoice(formData);
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
          className="text-ink-500 transition-colors hover:text-ink-100"
          aria-label={`Editar factura ${invoice.number}`}
        >
          <Pencil size={14} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Editar {invoice.number}
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <p className="mb-3 text-xs text-ink-500">
            Las líneas y montos no se editan aquí — solo cliente, proyecto, estado y vencimiento.
          </p>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="id" value={invoice.id} />
            <div>
              <label className={labelClass}>Cliente</label>
              <select name="clientId" required defaultValue={invoice.clientId} className={inputClass}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Proyecto (opcional)</label>
              <select name="projectId" defaultValue={invoice.projectId ?? ""} className={inputClass}>
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Estado</label>
                <select name="status" defaultValue={invoice.status} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vence (opcional)</label>
                <input type="date" name="dueDate" defaultValue={invoice.dueDate ?? ""} className={inputClass} />
              </div>
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
