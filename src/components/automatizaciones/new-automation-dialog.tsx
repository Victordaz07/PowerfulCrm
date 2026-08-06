"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";
import { createAutomation } from "@/app/(dashboard)/automatizaciones/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface-strong px-3 py-2 text-sm text-content focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-content-muted";

const RULE_TYPE_OPTIONS = [
  { value: "FACTURAS_POR_VENCER", label: "Facturas por vencer", daysLabel: "Avisar con cuántos días de anticipación" },
  { value: "LEADS_SIN_SEGUIMIENTO", label: "Leads sin seguimiento", daysLabel: "Avisar tras cuántos días sin novedades" },
] as const;

export function NewAutomationDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<(typeof RULE_TYPE_OPTIONS)[number]["value"]>("FACTURAS_POR_VENCER");
  const daysLabel = RULE_TYPE_OPTIONS.find((o) => o.value === type)?.daysLabel ?? "Días de anticipación";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAutomation(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(n) => { setOpen(n); if (!n) setError(null); }}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary">
          <Plus size={14} /> Crear automatización
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-[var(--panel-bg)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-content">Nueva automatización</Dialog.Title>
            <Dialog.Close className="text-content-dim hover:text-content">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass}>Descripción corta</label>
              <input
                name="title"
                required
                maxLength={200}
                className={inputClass}
                placeholder="Avisar facturas por vencer"
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de regla</label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className={inputClass}
              >
                {RULE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{daysLabel}</label>
              <input
                name="daysThreshold"
                type="number"
                min={1}
                max={365}
                required
                defaultValue={3}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Detalle (opcional)</label>
              <textarea
                name="description"
                rows={3}
                maxLength={500}
                className={inputClass}
                placeholder="Qué hace, cuándo se dispara…"
              />
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
                {isPending ? "Guardando…" : "Crear"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
