"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";
import { createResource } from "@/app/(dashboard)/crm/[id]/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface-strong px-3 py-2 text-sm text-content focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-content-muted";

export function NewResourceDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createResource(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(n) => { setOpen(n); if (!n) setError(null); }}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary">
          <Plus size={14} /> Agregar recurso
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-[var(--panel-bg)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-content">Agregar recurso</Dialog.Title>
            <Dialog.Close className="text-content-dim hover:text-content">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="clientId" value={clientId} />
            <div>
              <label className={labelClass}>Nombre</label>
              <input name="name" required maxLength={200} className={inputClass} placeholder="Brief de marca.pdf" />
            </div>
            <div>
              <label className={labelClass}>Enlace (opcional)</label>
              <input name="url" type="url" className={inputClass} placeholder="https://drive.google.com/…" />
              <p className="mt-1 text-[11px] text-content-dim">
                Pega un enlace a Drive, Dropbox, Figma, etc. La subida de archivos llega en una fase posterior.
              </p>
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
                {isPending ? "Guardando…" : "Agregar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
