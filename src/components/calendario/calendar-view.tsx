"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EventDialog } from "./event-dialog";
import { EventPill, type CalendarEvent } from "./event-pill";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface CalendarViewProps {
  anchor: string;
  events: CalendarEvent[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  leads: { id: string; title: string }[];
  canDeleteEvents: boolean;
}

export function CalendarView({ anchor, events, clients, projects, leads, canDeleteEvents }: CalendarViewProps) {
  const anchorDate = parseISO(anchor);
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const prevHref = `/calendario?m=${format(subMonths(anchorDate, 1), "yyyy-MM")}`;
  const nextHref = `/calendario?m=${format(addMonths(anchorDate, 1), "yyyy-MM")}`;
  const todayHref = `/calendario?m=${format(new Date(), "yyyy-MM")}`;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold capitalize text-content">
          {format(anchorDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1.5">
          <Link href={todayHref} className="rounded-lg border border-edge px-3 py-1.5 text-xs text-content-muted hover:text-content">
            Hoy
          </Link>
          <Link href={prevHref} className="rounded-lg border border-edge p-1.5 text-content-muted hover:text-content" aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </Link>
          <Link href={nextHref} className="rounded-lg border border-edge p-1.5 text-content-muted hover:text-content" aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setDialogDate(format(new Date(), "yyyy-MM-dd"))}
            className="ml-1 flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-400"
          >
            <Plus size={14} /> Nuevo evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-edge bg-surface text-xs">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="bg-[var(--panel-bg)] px-1 py-2 text-center font-medium text-content-dim sm:px-2">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));
          const inMonth = isSameMonth(day, anchorDate);
          return (
            <div
              key={dayKey}
              role="button"
              tabIndex={0}
              onClick={() => setDialogDate(dayKey)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setDialogDate(dayKey);
              }}
              className={cn(
                "flex min-h-[80px] cursor-pointer flex-col items-start gap-1 bg-[var(--panel-bg)] p-1.5 text-left transition-colors duration-fast hover:bg-surface sm:min-h-[110px]",
                !inMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                  isToday(day) ? "bg-primary-500 font-semibold text-white" : "text-content-muted"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="w-full space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventPill key={e.id} event={e} canDelete={canDeleteEvents} />
                ))}
                {dayEvents.length > 3 && (
                  <span className="block text-[10px] text-content-dim">+{dayEvents.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dialogDate && (
        <EventDialog
          open
          onOpenChange={(open) => !open && setDialogDate(null)}
          defaultDate={dialogDate}
          clients={clients}
          projects={projects}
          leads={leads}
        />
      )}
    </div>
  );
}
