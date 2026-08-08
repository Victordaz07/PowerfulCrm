"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDeleteButtonProps {
  action: (id: string) => Promise<{ error: string | null } | void>;
  id: string;
  itemLabel: string;
  className?: string;
  iconSize?: number;
}

// Botón de eliminar reutilizable: ícono de basura + diálogo de
// confirmación con Radix, usado por clientes, leads, proyectos y
// facturas. La action recibe el id y devuelve { error } — si el
// servidor rechaza el borrado (permiso o dependencias existentes),
// el mensaje se muestra inline en vez de romper la UI.
export function ConfirmDeleteButton({
  action,
  id,
  itemLabel,
  className,
  iconSize = 14,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await action(id);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn("text-content-dim transition-colors hover:text-danger", className)}
          aria-label={`Eliminar ${itemLabel}`}
        >
          <Trash2 size={iconSize} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onClick={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-[var(--panel-bg)] p-6 shadow-xl"
        >
          <Dialog.Title className="text-base font-semibold text-content">
            ¿Eliminar {itemLabel}?
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-content-muted">
            Esta acción no se puede deshacer.
          </Dialog.Description>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg px-3 py-2 text-sm text-content-muted hover:text-content"
            >
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={isPending}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
