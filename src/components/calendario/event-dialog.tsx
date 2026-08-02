"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { createEvent } from "@/app/(dashboard)/calendario/actions";

const TYPE_OPTIONS = [
  { value: "REUNION", label: "Reunión" },
  { value: "LLAMADA", label: "Llamada" },
  { value: "ENTREGA", label: "Entrega" },
  { value: "RECORDATORIO", label: "Recordatorio" },
  { value: "OTRO", label: "Otro" },
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  leads: { id: string; title: string }[];
}

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

export function EventDialog({ open, onOpenChange, defaultDate, clients, projects, leads }: EventDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEvent(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">Nuevo evento</Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass}>Título</label>
              <input name="title" required maxLength={120} className={inputClass} placeholder="Llamada de seguimiento" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipo</label>
                <select name="type" defaultValue="REUNION" className={inputClass}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha</label>
                <input type="date" name="date" required defaultValue={defaultDate} className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-ink-400">
              <input
                type="checkbox"
                name="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="accent-primary-500"
              />
              Todo el día
            </label>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Hora inicio</label>
                  <input type="time" name="startTime" defaultValue="10:00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hora fin</label>
                  <input type="time" name="endTime" defaultValue="11:00" className={inputClass} />
                </div>
              </div>
            )}

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

            {projects.length > 0 && (
              <div>
                <label className={labelClass}>Proyecto (opcional)</label>
                <select name="projectId" defaultValue="" className={inputClass}>
                  <option value="">— Ninguno —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {leads.length > 0 && (
              <div>
                <label className={labelClass}>Lead (opcional)</label>
                <select name="leadId" defaultValue="" className={inputClass}>
                  <option value="">— Ninguno —</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Ubicación / link (opcional)</label>
              <input name="location" className={inputClass} placeholder="Google Meet, oficina…" />
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
                {isPending ? "Guardando…" : "Crear evento"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
