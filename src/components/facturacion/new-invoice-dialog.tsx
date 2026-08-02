"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/app/(dashboard)/facturacion/actions";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-ink-400";

interface NewInvoiceDialogProps {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

interface ItemRow {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

let nextKey = 1;
function emptyItem(): ItemRow {
  return { key: nextKey++, description: "", quantity: "1", unitPrice: "0" };
}

export function NewInvoiceDialog({ clients, projects }: NewInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("MXN");
  const [tax, setTax] = useState("0");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const subtotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    return sum + q * p;
  }, 0);
  const total = subtotal + (Number(tax) || 0);

  function updateItem(key: number, field: keyof Omit<ItemRow, "key">, value: string) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createInvoice(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setItems([emptyItem()]);
        setTax("0");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus size={14} /> Nueva factura
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink-50">
              Nueva factura
            </Dialog.Title>
            <Dialog.Close className="text-ink-500 hover:text-ink-200">
              <X size={18} />
            </Dialog.Close>
          </div>

          {clients.length === 0 ? (
            <p className="text-sm text-ink-400">
              Primero crea un cliente desde la sección Clientes para poder facturarle.
            </p>
          ) : (
            <form action={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select name="type" defaultValue="FACTURA" className={inputClass}>
                    <option value="FACTURA">Factura</option>
                    <option value="COTIZACION">Cotización</option>
                  </select>
                </div>
              </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Moneda</label>
                  <input
                    name="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    maxLength={3}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Vence (opcional)</label>
                  <input type="date" name="dueDate" className={inputClass} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={labelClass}>Conceptos</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    + Agregar línea
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.key} className="flex gap-2">
                      <input
                        name="itemDescription"
                        value={item.description}
                        onChange={(e) => updateItem(item.key, "description", e.target.value)}
                        placeholder="Descripción"
                        className={cn(inputClass, "flex-1")}
                      />
                      <input
                        name="itemQuantity"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, "quantity", e.target.value)}
                        inputMode="decimal"
                        placeholder="Cant."
                        className={cn(inputClass, "w-16")}
                      />
                      <input
                        name="itemUnitPrice"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.key, "unitPrice", e.target.value)}
                        inputMode="decimal"
                        placeholder="Precio"
                        className={cn(inputClass, "w-24")}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length === 1}
                        className="text-ink-500 hover:text-danger disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Impuesto (monto fijo, opcional)</label>
                  <input
                    name="tax"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    inputMode="decimal"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-xs text-ink-400">Total</span>
                  <span className="text-base font-semibold text-ink-50">
                    {formatCurrency(total, currency || "MXN")}
                  </span>
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
                  {isPending ? "Guardando…" : "Crear factura"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
