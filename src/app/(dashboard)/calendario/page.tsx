import { CalendarDays } from "lucide-react";

export default function CalendarioPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-50">Calendario</h1>
        <p className="text-sm text-ink-400">Agenda de reuniones y entregas.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-800 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15">
          <CalendarDays size={26} className="text-primary-400" />
        </div>
        <p className="text-sm font-medium text-ink-100">Todavía en construcción</p>
        <p className="mt-1 max-w-sm text-xs text-ink-500">
          El calendario y el agendamiento con clientes van en el roadmap — mientras tanto,
          da seguimiento a fechas de entrega desde Proyectos y Facturación.
        </p>
      </div>
    </div>
  );
}
