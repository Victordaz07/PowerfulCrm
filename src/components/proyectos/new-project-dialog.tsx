"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";
import { createProject } from "@/app/(dashboard)/proyectos/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface-strong px-3 py-2 text-sm text-content focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-content-muted";

interface NewProjectDialogProps {
  clients: { id: string; name: string }[];
}

export function NewProjectDialog({ clients }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProject(formData);
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
          <Plus size={14} /> Nuevo proyecto
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-edge bg-[var(--panel-bg)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-content">
              Nuevo proyecto
            </Dialog.Title>
            <Dialog.Close className="text-content-dim hover:text-content">
              <X size={18} />
            </Dialog.Close>
          </div>

          {clients.length === 0 ? (
            <p className="text-sm text-content-muted">
              Primero crea un cliente desde la sección Clientes para poder asignarle un proyecto.
            </p>
          ) : (
            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Nombre del proyecto</label>
                <input
                  name="name"
                  required
                  maxLength={160}
                  className={inputClass}
                  placeholder="Rediseño de sitio web"
                />
              </div>
              <div>
                <label className={labelClass}>Cliente</label>
                <select name="clientId" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Inicio (opcional)</label>
                  <input type="date" name="startDate" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Entrega (opcional)</label>
                  <input type="date" name="dueDate" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descripción (opcional)</label>
                <textarea name="description" rows={3} className={inputClass} placeholder="Alcance, notas…" />
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
                  {isPending ? "Guardando…" : "Crear proyecto"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
