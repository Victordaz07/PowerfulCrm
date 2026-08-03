"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil } from "lucide-react";
import { updateClient } from "@/app/(dashboard)/crm/actions";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

interface EditClientDialogProps {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
  };
}

export function EditClientDialog({ client }: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateClient(formData);
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
          className="text-ink-500 transition-colors hover:text-ink-100"
          aria-label={`Editar ${client.name}`}
        >
          <Pencil size={14} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onClick={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Editar cliente
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="id" value={client.id} />
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={client.name}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email (opcional)</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={client.email ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono (opcional)</label>
                <input name="phone" defaultValue={client.phone ?? ""} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Empresa (opcional)</label>
              <input name="company" defaultValue={client.company ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notas (opcional)</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={client.notes ?? ""}
                className={inputClass}
              />
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
