"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveAiApiKey, deleteAiApiKey } from "@/app/(dashboard)/configuracion/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface-strong px-3 py-2 text-sm text-content focus:border-primary-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-content-muted";

const PROVIDER_OPTIONS = [
  { value: "ANTHROPIC", label: "Anthropic (Claude)" },
  { value: "OPENAI", label: "OpenAI (GPT)" },
  { value: "GOOGLE", label: "Google (Gemini)" },
] as const;

interface AiKeyFormProps {
  currentProvider: string | null;
}

export function AiKeyForm({ currentProvider }: AiKeyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<(typeof PROVIDER_OPTIONS)[number]["value"]>(
    (currentProvider as (typeof PROVIDER_OPTIONS)[number]["value"]) ?? "ANTHROPIC"
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveAiApiKey(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAiApiKey();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {currentProvider && (
        <div className="flex items-center gap-2 rounded-lg border border-edge bg-success/10 px-3 py-2 text-sm text-success">
          <Check size={15} />
          Conectado con {PROVIDER_OPTIONS.find((p) => p.value === currentProvider)?.label ?? currentProvider}
        </div>
      )}

      <form action={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>Proveedor</label>
          <select
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as typeof provider)}
            className={inputClass}
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tu API key</label>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            required
            minLength={10}
            maxLength={400}
            placeholder={currentProvider ? "Pega una nueva key para reemplazar la actual" : "sk-... / AIza..."}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-content-dim">
            La probamos contra el proveedor antes de guardarla, y se guarda cifrada — nunca la mostramos de nuevo
            en pantalla.
          </p>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Validando…" : currentProvider ? "Reemplazar key" : "Guardar key"}
          </button>
          {currentProvider && (
            <Button type="button" variant="secondary" size="sm" onClick={handleDelete} disabled={isPending}>
              Desconectar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
