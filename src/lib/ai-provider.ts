import type { AiProvider } from "@prisma/client";

// Llamadas directas por fetch a la REST API de cada proveedor en vez de
// instalar 3 SDKs — el uso aquí es un solo prompt de texto por llamada,
// no vale la pena el peso extra de @anthropic-ai/sdk + openai +
// @google/generative-ai para eso. BYOK: la key es la del tenant, nunca
// una nuestra — por eso este helper solo la recibe como parámetro, ya
// desencriptada, y no la guarda ni la loguea en ningún lado.

export class AiProviderError extends Error {}

export async function askAiProvider(
  provider: AiProvider,
  apiKey: string,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "ANTHROPIC":
      return askAnthropic(apiKey, prompt);
    case "OPENAI":
      return askOpenAi(apiKey, prompt);
    case "GOOGLE":
      return askGoogle(apiKey, prompt);
  }
}

async function askAnthropic(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new AiProviderError(await extractProviderError(res));
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new AiProviderError("Respuesta vacía del proveedor");
  return text;
}

async function askOpenAi(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new AiProviderError(await extractProviderError(res));
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new AiProviderError("Respuesta vacía del proveedor");
  return text;
}

async function askGoogle(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) throw new AiProviderError(await extractProviderError(res));
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new AiProviderError("Respuesta vacía del proveedor");
  return text;
}

async function extractProviderError(res: Response): Promise<string> {
  if (res.status === 401 || res.status === 403) return "API key inválida o sin permisos";
  if (res.status === 429) return "Límite de uso del proveedor alcanzado, intenta más tarde";
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? `Error del proveedor (${res.status})`;
  } catch {
    return `Error del proveedor (${res.status})`;
  }
}
