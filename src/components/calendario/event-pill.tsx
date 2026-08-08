"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteEvent } from "@/app/(dashboard)/calendario/actions";

export interface CalendarEvent {
  id: string;
  title: string;
  type: "REUNION" | "LLAMADA" | "ENTREGA" | "RECORDATORIO" | "OTRO";
  startAt: string;
  endAt: string;
  allDay: boolean;
  clientName: string | null;
  projectName: string | null;
  leadTitle: string | null;
  location: string | null;
}

const TYPE_DOT: Record<CalendarEvent["type"], string> = {
  REUNION: "bg-primary-500",
  LLAMADA: "bg-success",
  ENTREGA: "bg-warning",
  RECORDATORIO: "bg-danger",
  OTRO: "bg-content-dim",
};

export function EventPill({ event, canDelete }: { event: CalendarEvent; canDelete: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group flex items-center gap-1 rounded-md bg-surface-strong px-1.5 py-0.5">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[event.type])} />
      <span className="flex-1 truncate text-[10px] text-content">{event.title}</span>
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => deleteEvent(event.id));
          }}
          disabled={isPending}
          className="block shrink-0 text-content-dim transition-colors hover:text-danger sm:hidden sm:group-hover:block sm:group-focus-within:block"
          aria-label={`Eliminar ${event.title}`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
