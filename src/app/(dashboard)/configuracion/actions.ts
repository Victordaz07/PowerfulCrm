"use server";

import { getTenantDb } from "@/lib/tenant";
import { requireTenantAdmin } from "@/lib/authz";
import { encrypt } from "@/lib/crypto";
import { askAiProvider, AiProviderError } from "@/lib/ai-provider";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PROVIDERS = ["ANTHROPIC", "OPENAI", "GOOGLE"] as const;

const saveAiApiKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(10, "La API key se ve demasiado corta").max(400),
});

export async function saveAiApiKey(formData: FormData) {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para configurar esto — se requiere rol de administrador." };
  }

  const parsed = saveAiApiKeySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { provider, apiKey } = parsed.data;

  // Se prueba la key real contra el proveedor antes de guardarla — evita
  // dejar una key inválida configurada y que el asistente falle después
  // sin que el usuario sepa por qué.
  try {
    await askAiProvider(provider, apiKey, "Responde solo con la palabra: ok");
  } catch (err) {
    const message = err instanceof AiProviderError ? err.message : "No se pudo validar la key con el proveedor";
    return { error: message };
  }

  const { db, tenantId } = await getTenantDb();
  await db.tenant.update({
    where: { id: tenantId },
    data: { aiProvider: provider, aiApiKeyEncrypted: encrypt(apiKey) },
  });

  revalidatePath("/configuracion");
  return { error: null };
}

export async function deleteAiApiKey() {
  try {
    await requireTenantAdmin();
  } catch {
    return { error: "No tienes permiso para eliminar esto — se requiere rol de administrador." };
  }

  const { db, tenantId } = await getTenantDb();
  await db.tenant.update({
    where: { id: tenantId },
    data: { aiProvider: null, aiApiKeyEncrypted: null },
  });

  revalidatePath("/configuracion");
  return { error: null };
}
