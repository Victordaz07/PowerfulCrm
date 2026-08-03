"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil } from "lucide-react";
import { updateProject } from "@/app/(dashboard)/proyectos/actions";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

const STATUSES = [
  { key: "ACTIVO", label: "Activo" },
  { key: "EN_PAUSA", label: "En pausa" },
  { key: "COMPLETADO", label: "Completado" },
  { key: "CANCELADO", label: "Cancelado" },
] as const;

interface EditProjectDialogProps {
  project: {
    id: string;
    name: string;
    clientId: string;
    status: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
  };
  clients: { id: string; name: string }[];
}

export function EditProjectDialog({ project, clients }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProject(formData);
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
          aria-label={`Editar ${project.name}`}
        >
          <Pencil size={14} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Editar proyecto
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="id" value={project.id} />
            <div>
              <label className={labelClass}>Nombre del proyecto</label>
              <input name="name" required maxLength={160} defaultValue={project.name} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cliente</label>
                <select name="clientId" required defaultValue={project.clientId} className={inputClass}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select name="status" defaultValue={project.status} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Inicio (opcional)</label>
                <input type="date" name="startDate" defaultValue={project.startDate ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Entrega (opcional)</label>
                <input type="date" name="dueDate" defaultValue={project.dueDate ?? ""} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Descripción (opcional)</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={project.description ?? ""}
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
