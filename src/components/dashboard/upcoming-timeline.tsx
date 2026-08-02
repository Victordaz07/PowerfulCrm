import { cn } from "@/lib/utils";

export interface UpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  tone: "primary" | "neutral" | "danger";
}

const DOT_TONE: Record<UpcomingItem["tone"], string> = {
  primary: "bg-primary-500",
  neutral: "bg-ink-500",
  danger: "bg-danger",
};

const TITLE_TONE: Record<UpcomingItem["tone"], string> = {
  primary: "text-ink-50",
  neutral: "text-ink-50",
  danger: "text-danger",
};

export function UpcomingTimeline({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-ink-500">
        No hay tareas ni facturas por vencer en los próximos días.
      </p>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="absolute bottom-2 left-[7px] top-2 w-px border-l border-dashed border-ink-800" />
      {items.map((item, i) => (
        <div key={item.id} className="relative flex gap-4">
          <div className={cn("z-10 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full", DOT_TONE[item.tone])} />
          <div className={cn("flex-1", i === items.length - 1 ? "" : "pb-1")}>
            <div className="flex items-center justify-between gap-3">
              <h4 className={cn("text-sm font-medium", TITLE_TONE[item.tone])}>{item.title}</h4>
              <span className="whitespace-nowrap text-[11px] text-ink-400">{item.date}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-400">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
