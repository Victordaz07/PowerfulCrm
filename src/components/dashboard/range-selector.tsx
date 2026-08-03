import Link from "next/link";
import { cn } from "@/lib/utils";

interface RangeSelectorProps {
  options: readonly number[];
  selected: number;
}

// Filtro de rango de fecha para la tendencia de ingresos — navega vía
// query string (?range=N), así que no necesita ser un Client Component:
// Next re-renderiza el Server Component de la página con el nuevo valor.
export function RangeSelector({ options, selected }: RangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-ink-950 p-1">
      {options.map((opt) => (
        <Link
          key={opt}
          href={`/dashboard?range=${opt}`}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-fast",
            opt === selected ? "bg-primary-500 text-white" : "text-ink-400 hover:text-ink-100"
          )}
        >
          {opt}M
        </Link>
      ))}
    </div>
  );
}
