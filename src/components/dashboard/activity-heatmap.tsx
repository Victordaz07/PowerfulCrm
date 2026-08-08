import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  days: { date: string; count: number }[];
}

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

const LEVEL_STYLES = [
  "bg-surface-strong",
  "bg-primary-500/25",
  "bg-primary-500/45",
  "bg-primary-500/70",
  "bg-primary-500",
];

// Heatmap estilo GitHub: un cuadro por día, agrupado en columnas de
// semana (domingo-sábado) para que se lea de izquierda (más viejo) a
// derecha (hoy). Puramente presentacional — no necesita "use client",
// los tooltips son el atributo title nativo del navegador.
export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  for (const day of days) {
    const dow = new Date(day.date).getUTCDay();
    if (currentWeek.length === 0 && dow !== 0) {
      for (let i = 0; i < dow; i++) currentWeek.push({ date: "", count: -1 });
    }
    currentWeek.push(day);
    if (dow === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day.count === -1 ? (
                <div key={di} className="h-3 w-3" />
              ) : (
                <div
                  key={di}
                  title={`${format(new Date(day.date), "d 'de' MMMM", { locale: es })} · ${day.count} ${
                    day.count === 1 ? "actividad" : "actividades"
                  }`}
                  className={cn("h-3 w-3 rounded-sm", LEVEL_STYLES[levelFor(day.count)])}
                />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-content-dim">
        <span>Menos</span>
        {LEVEL_STYLES.map((cls, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-sm", cls)} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
