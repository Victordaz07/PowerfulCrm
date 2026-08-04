import { getTenantDb } from "@/lib/tenant";
import { isTenantAdmin } from "@/lib/authz";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContractDialog, type ContractDTO } from "@/components/crm/contract-dialog";
import { NewResourceDialog } from "@/components/crm/new-resource-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteContract, deleteResource } from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Defensa en profundidad: createResource ya valida el protocolo, pero
// esto cubre filas creadas antes de ese fix — sin esto, un valor como
// "javascript:alert(document.cookie)" se renderiza en un <a href> real.
function isSafeResourceUrl(url: string) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

type Badge = { background: string; color: string };
const CONTRACT_BADGE: Record<string, Badge> = {
  ACTIVO: { background: "oklch(65% 0.15 150 / 0.18)", color: "oklch(60% 0.15 150)" },
  BORRADOR: { background: "oklch(78% 0.15 80 / 0.2)", color: "oklch(60% 0.15 80)" },
  FINALIZADO: { background: "var(--surface-strong)", color: "var(--content-muted)" },
  CANCELADO: { background: "oklch(68% 0.17 25 / 0.2)", color: "oklch(58% 0.17 25)" },
};
const CONTRACT_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  BORRADOR: "Borrador",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};
const INVOICE_BADGE: Record<string, Badge> = {
  PAGADA: { background: "oklch(65% 0.15 150 / 0.18)", color: "oklch(60% 0.15 150)" },
  PENDIENTE: { background: "oklch(78% 0.15 80 / 0.2)", color: "oklch(60% 0.15 80)" },
  VENCIDA: { background: "oklch(68% 0.17 25 / 0.2)", color: "oklch(58% 0.17 25)" },
  ENVIADA: { background: "oklch(70% 0.14 230 / 0.2)", color: "oklch(65% 0.14 230)" },
  BORRADOR: { background: "var(--surface-strong)", color: "var(--content-muted)" },
  CANCELADA: { background: "var(--surface-strong)", color: "var(--content-dim)" },
};

function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

const cardClass = "rounded-2xl border border-edge bg-surface p-6 backdrop-blur-md";
const sectionTitle = "mb-4 text-sm font-semibold text-content";

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { db } = await getTenantDb();

  const [client, canDelete] = await Promise.all([
    db.client.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: "desc" } },
        projects: { orderBy: { createdAt: "desc" } },
        contracts: { orderBy: { createdAt: "desc" } },
        resources: { orderBy: { createdAt: "desc" } },
      },
    }),
    isTenantAdmin(),
  ]);

  if (!client) notFound();

  const totalBilled = client.invoices
    .filter((i) => i.status === "PAGADA")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const initials = client.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6 p-8">
      <Link href="/crm" className="inline-flex items-center gap-2 text-sm text-content-muted hover:text-content">
        <ArrowLeft size={16} /> Volver a Clientes
      </Link>

      {/* Cabecera */}
      <div className={`${cardClass} flex items-center gap-4`}>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-content">{client.name}</h1>
          <p className="text-sm text-content-muted">
            {[client.company, client.email, client.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total facturado", value: formatCurrency(totalBilled, client.invoices[0]?.currency ?? "MXN") },
          { label: "Proyectos", value: String(client.projects.length) },
          { label: "Contratos", value: String(client.contracts.length) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-edge bg-surface p-5 backdrop-blur-md">
            <div className="text-xs text-content-muted">{kpi.label}</div>
            <div className="mt-1.5 text-2xl font-bold text-content">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Contratos */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content">Contratos</h2>
          <ContractDialog clientId={client.id} />
        </div>
        {client.contracts.length === 0 ? (
          <p className="text-sm text-content-muted">Sin contratos todavía.</p>
        ) : (
          <div className="flex flex-col">
            {client.contracts.map((ct) => {
              const dto: ContractDTO = {
                id: ct.id,
                title: ct.title,
                status: ct.status,
                value: ct.value ? Number(ct.value) : null,
                startDate: toDateInput(ct.startDate),
                endDate: toDateInput(ct.endDate),
                notes: ct.notes,
              };
              return (
                <div key={ct.id} className="group flex items-center gap-3 border-b border-edge py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-content">{ct.title}</div>
                    <div className="text-xs text-content-dim">
                      {ct.startDate ? formatDate(ct.startDate) : "Sin fecha"}
                      {ct.endDate ? ` — ${formatDate(ct.endDate)}` : ""}
                    </div>
                  </div>
                  {ct.value != null && (
                    <span className="text-sm font-semibold text-content">
                      {formatCurrency(Number(ct.value), ct.currency)}
                    </span>
                  )}
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={CONTRACT_BADGE[ct.status]}
                  >
                    {CONTRACT_LABEL[ct.status]}
                  </span>
                  <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <ContractDialog clientId={client.id} contract={dto} />
                    {canDelete && (
                      <ConfirmDeleteButton action={deleteContract} id={ct.id} itemLabel={ct.title} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recursos */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content">Recursos</h2>
          <NewResourceDialog clientId={client.id} />
        </div>
        {client.resources.length === 0 ? (
          <p className="text-sm text-content-muted">Sin archivos todavía.</p>
        ) : (
          <div className="flex flex-col">
            {client.resources.map((r) => (
              <div key={r.id} className="group flex items-center gap-3 border-b border-edge py-3 last:border-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-content-dim" />
                <div className="min-w-0 flex-1 text-sm text-content">
                  {r.url && isSafeResourceUrl(r.url) ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                      {r.name}
                    </a>
                  ) : (
                    r.name
                  )}
                </div>
                {canDelete && (
                  <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <ConfirmDeleteButton action={deleteResource} id={r.id} itemLabel={r.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facturas */}
      <div className={cardClass}>
        <h2 className={sectionTitle}>Facturas</h2>
        {client.invoices.length === 0 ? (
          <p className="text-sm text-content-muted">Sin facturas todavía.</p>
        ) : (
          <div className="flex flex-col">
            {client.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 border-b border-edge py-3 last:border-0">
                <span className="w-24 shrink-0 text-xs font-semibold text-content-dim">{inv.number}</span>
                <span className="flex-1 text-xs text-content-muted">{formatDate(inv.createdAt)}</span>
                <span className="text-sm font-semibold text-content">
                  {formatCurrency(Number(inv.total), inv.currency)}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={INVOICE_BADGE[inv.status] ?? INVOICE_BADGE.BORRADOR}
                >
                  {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proyectos */}
      <div className={cardClass}>
        <h2 className={sectionTitle}>Proyectos</h2>
        {client.projects.length === 0 ? (
          <p className="text-sm text-content-muted">Sin proyectos todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {client.projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-edge bg-surface-soft p-4">
                <div className="text-sm font-medium text-content">{p.name}</div>
                <div className="mt-1 text-xs text-content-dim">
                  {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
