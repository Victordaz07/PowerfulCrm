"use server";

// Server Actions del Asistente IA — comparten este archivo (no una
// carpeta de página propia) porque el panel se renderiza desde
// AppShell y está disponible en todas las rutas del dashboard, no en
// una sola sección.

import { getTenantDb } from "@/lib/tenant";
import { decrypt } from "@/lib/crypto";
import { askAiProvider, AiProviderError } from "@/lib/ai-provider";

export interface AssistantSuggestion {
  id: string;
  text: string;
}

export interface AssistantState {
  configured: boolean;
  suggestions: AssistantSuggestion[];
}

export async function getAssistantState(): Promise<AssistantState> {
  const { db, tenantId } = await getTenantDb();
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { aiProvider: true } });
  if (!tenant?.aiProvider) return { configured: false, suggestions: [] };

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const staleSince = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const [dueInvoices, staleLeads] = await Promise.all([
    db.invoice.findMany({
      where: { status: { in: ["PENDIENTE", "ENVIADA", "VENCIDA"] }, dueDate: { not: null, lte: in7Days } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
    db.lead.findMany({
      where: { stage: { notIn: ["GANADO", "PERDIDO"] }, updatedAt: { lte: staleSince } },
      orderBy: { updatedAt: "asc" },
      take: 3,
    }),
  ]);

  const suggestions: AssistantSuggestion[] = [
    ...dueInvoices.map((inv) => ({
      id: `invoice-${inv.id}`,
      text: `Factura ${inv.number} de ${inv.client.name} vence el ${new Date(inv.dueDate!).toLocaleDateString("es-MX")}.`,
    })),
    ...staleLeads.map((lead) => ({
      id: `lead-${lead.id}`,
      text: `El lead "${lead.title}" lleva sin novedades desde el ${new Date(lead.updatedAt).toLocaleDateString("es-MX")}.`,
    })),
  ];

  if (suggestions.length === 0) {
    suggestions.push({ id: "none", text: "No hay pendientes urgentes por ahora — todo al día." });
  }

  return { configured: true, suggestions };
}

export async function askAssistant(question: string): Promise<{ answer: string | null; error: string | null }> {
  const q = question.trim();
  if (!q) return { answer: null, error: "Escribe una pregunta" };
  if (q.length > 1000) return { answer: null, error: "La pregunta es demasiado larga" };

  const { db, tenantId } = await getTenantDb();
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { aiProvider: true, aiApiKeyEncrypted: true, name: true },
  });
  if (!tenant?.aiProvider || !tenant.aiApiKeyEncrypted) {
    return { answer: null, error: "Configura tu API key en Configuración primero" };
  }

  try {
    const apiKey = decrypt(tenant.aiApiKeyEncrypted);
    const prompt = `Eres el asistente del CRM de "${tenant.name}", un negocio de un freelancer o equipo pequeño. Responde en español, breve y directo (máximo 4 líneas, sin markdown). Pregunta: ${q}`;
    const answer = await askAiProvider(tenant.aiProvider, apiKey, prompt);
    return { answer, error: null };
  } catch (err) {
    const message = err instanceof AiProviderError ? err.message : "No se pudo contactar al proveedor de IA";
    return { answer: null, error: message };
  }
}
