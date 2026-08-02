import { getTenantDb } from "@/lib/tenant";
import { CalendarView } from "@/components/calendario/calendar-view";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

interface CalendarioPageProps {
  searchParams: Promise<{ m?: string }>;
}

export default async function CalendarioPage(props: CalendarioPageProps) {
  const searchParams = await props.searchParams;
  const { db } = await getTenantDb();
  const now = new Date();

  const [yearStr, monthStr] = (searchParams.m ?? "").split("-");
  const year = Number(yearStr) || now.getFullYear();
  const monthIndex = monthStr ? Number(monthStr) - 1 : now.getMonth();
  const anchor = new Date(year, Number.isFinite(monthIndex) ? monthIndex : now.getMonth(), 1);

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const [events, clients, projects, leads] = await Promise.all([
    db.event.findMany({
      where: { startAt: { gte: gridStart, lte: gridEnd } },
      include: { client: true, project: true, lead: true },
      orderBy: { startAt: "asc" },
    }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.project.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.lead.findMany({ where: { stage: { not: "PERDIDO" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-50">Calendario</h1>
        <p className="text-sm text-ink-400">Agenda de reuniones, llamadas y entregas.</p>
      </div>

      <CalendarView
        anchor={anchor.toISOString()}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startAt: e.startAt.toISOString(),
          endAt: e.endAt.toISOString(),
          allDay: e.allDay,
          clientName: e.client?.name ?? null,
          projectName: e.project?.name ?? null,
          leadTitle: e.lead?.title ?? null,
          location: e.location,
        }))}
        clients={clients}
        projects={projects}
        leads={leads}
      />
    </div>
  );
}
