import { cn, formatCurrency, formatDate } from "@/lib/utils";

export interface RecentInvoiceRow {
  id: string;
  clientName: string;
  number: string;
  date: Date;
  total: number;
  currency: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  PAGADA: "bg-success/15 text-success",
  PENDIENTE: "bg-warning/15 text-warning",
  VENCIDA: "bg-danger/15 text-danger",
  BORRADOR: "bg-surface-strong text-content-muted",
  ENVIADA: "bg-surface-strong text-content",
  CANCELADA: "bg-surface-strong text-content-dim",
};

const BADGE_COLORS = ["bg-primary-500/20 text-primary-400", "bg-success/20 text-success", "bg-danger/20 text-danger"];

function badgeColor(name: string) {
  const index = name.charCodeAt(0) % BADGE_COLORS.length;
  return BADGE_COLORS[index];
}

export function RecentInvoicesTable({ rows }: { rows: RecentInvoiceRow[] }) {
  if (rows.length === 0) {
    return <p className="px-6 py-10 text-center text-sm text-content-dim">Aún no has creado ninguna factura.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-xs text-content-muted">
            <th className="px-6 py-3 font-medium">Cliente</th>
            <th className="px-6 py-3 font-medium">Número</th>
            <th className="px-6 py-3 font-medium">Fecha</th>
            <th className="px-6 py-3 font-medium">Importe</th>
            <th className="px-6 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800/40">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors duration-fast hover:bg-white/[0.02]">
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      badgeColor(row.clientName)
                    )}
                  >
                    {row.clientName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-content">{row.clientName}</span>
                </div>
              </td>
              <td className="px-6 py-3.5 font-mono text-xs text-content-muted">{row.number}</td>
              <td className="px-6 py-3.5 text-content-muted">{formatDate(row.date)}</td>
              <td className="px-6 py-3.5 num font-medium text-content">
                {formatCurrency(row.total, row.currency)}
              </td>
              <td className="px-6 py-3.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    STATUS_STYLES[row.status] ?? "bg-surface-strong text-content-muted"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
