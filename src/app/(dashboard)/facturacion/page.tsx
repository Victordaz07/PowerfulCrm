import { getTenantDb } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Image from "next/image";

const STATUS_STYLES: Record<string, string> = {
  PAGADA: "bg-success/15 text-success",
  PENDIENTE: "bg-warning/15 text-warning",
  VENCIDA: "bg-danger/15 text-danger",
  BORRADOR: "bg-ink-700 text-ink-300",
  ENVIADA: "bg-ink-700 text-ink-200",
  CANCELADA: "bg-ink-800 text-ink-500",
};

export default async function FacturacionPage() {
  const { db } = await getTenantDb();
  const invoices = await db.invoice.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-50">Facturación</h1>
          <p className="text-sm text-ink-400">Cotizaciones, facturas y estado de pago.</p>
        </div>
        <Button size="sm">
          <Plus size={14} /> Nueva factura
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900 text-left text-xs text-ink-400">
              <th className="px-4 py-3 font-medium">Folio</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-ink-800 last:border-0 hover:bg-ink-900/60 transition-colors duration-fast"
              >
                <td className="px-4 py-3 font-mono text-xs text-ink-300">{inv.number}</td>
                <td className="px-4 py-3 text-ink-100">{inv.client.name}</td>
                <td className="px-4 py-3 text-ink-400">
                  {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-ink-50">
                  {formatCurrency(Number(inv.total), inv.currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[inv.status]
                    )}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Image
                      src="/illustrations/empty-invoices.png"
                      alt=""
                      width={140}
                      height={140}
                      className="mb-3"
                    />
                    <p className="text-sm text-ink-500">Aún no has creado ninguna factura.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
