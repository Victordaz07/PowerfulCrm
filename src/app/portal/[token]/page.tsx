import Image from "next/image";
import { notFound } from "next/navigation";
import { getSystemDb } from "@/lib/tenant";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { createCheckoutSession } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PAGADA: "Pagada",
  PENDIENTE: "Pendiente de pago",
  VENCIDA: "Vencida",
  ENVIADA: "Enviada",
  BORRADOR: "Borrador",
  CANCELADA: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
  PAGADA: "bg-success/15 text-success",
  PENDIENTE: "bg-warning/15 text-warning",
  VENCIDA: "bg-danger/15 text-danger",
  ENVIADA: "bg-ink-700 text-ink-200",
  BORRADOR: "bg-ink-700 text-ink-300",
  CANCELADA: "bg-ink-800 text-ink-500",
};

const PAYABLE_STATUSES = new Set(["PENDIENTE", "ENVIADA", "VENCIDA"]);

interface PortalPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pago?: string; error?: string }>;
}

export default async function PortalInvoicePage(props: PortalPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const db = getSystemDb();
  const invoice = await db.invoice.findUnique({
    where: { publicToken: params.token },
    include: { client: true, tenant: true, items: true },
  });

  if (!invoice) notFound();

  const canPay = PAYABLE_STATUSES.has(invoice.status);
  const payAction = createCheckoutSession.bind(null, params.token);

  return (
    <div className="min-h-screen bg-ink-950 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl">
          <Image
            src="/portal/client-payment-hero.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="glass-panel rounded-2xl border border-ink-800/60 bg-ink-900/70 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-ink-400">{invoice.tenant.name}</p>
              <h1 className="mt-1 text-xl font-semibold text-ink-50">
                Factura {invoice.number}
              </h1>
              <p className="mt-1 text-sm text-ink-400">Para {invoice.client.name}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                STATUS_STYLES[invoice.status] ?? "bg-ink-800 text-ink-300"
              )}
            >
              {STATUS_LABEL[invoice.status] ?? invoice.status}
            </span>
          </div>

          {searchParams.pago === "exitoso" && (
            <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              Pago recibido. Puede tardar unos segundos en reflejarse aquí.
            </p>
          )}
          {searchParams.pago === "cancelado" && (
            <p className="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.
            </p>
          )}
          {searchParams.error && (
            <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              No se pudo iniciar el pago. Intenta de nuevo en un momento.
            </p>
          )}

          <div className="mb-6 divide-y divide-ink-800/50 rounded-xl border border-ink-800/60">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm text-ink-100">{item.description}</p>
                  <p className="text-xs text-ink-500">
                    {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice), invoice.currency)}
                  </p>
                </div>
                <p className="text-sm font-medium text-ink-50">
                  {formatCurrency(Number(item.quantity) * Number(item.unitPrice), invoice.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-400">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
            </div>
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-ink-400">
                <span>Impuesto</span>
                <span>{formatCurrency(Number(invoice.tax), invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-800/60 pt-1.5 text-base font-semibold text-ink-50">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total), invoice.currency)}</span>
            </div>
            {invoice.dueDate && (
              <p className="pt-1 text-xs text-ink-500">Vence el {formatDate(invoice.dueDate)}</p>
            )}
          </div>

          {canPay ? (
            <form action={payAction}>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-400"
              >
                Pagar {formatCurrency(Number(invoice.total), invoice.currency)}
              </button>
            </form>
          ) : invoice.status === "PAGADA" ? (
            <p className="text-center text-sm text-success">
              Esta factura ya fue pagada, ¡gracias!
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-ink-600">{invoice.tenant.name}</p>
      </div>
    </div>
  );
}
