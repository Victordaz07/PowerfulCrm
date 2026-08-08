"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, X, Loader2, Settings } from "lucide-react";
import { getAssistantState, askAssistant, type AssistantSuggestion } from "@/app/(dashboard)/assistant-actions";

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ChatEntry {
  role: "user" | "assistant";
  text: string;
}

/**
 * Panel lateral del Asistente IA. BYOK: usa la API key que el tenant
 * configuró en /configuracion (Fase 4) — sugerencias reales (facturas
 * por vencer, leads sin seguimiento) y un chat que llama de verdad al
 * proveedor elegido. Si no hay key configurada, muestra un CTA en vez
 * de fallar.
 */
export function AiAssistantPanel({ open, onClose }: AiAssistantPanelProps) {
  const [configured, setConfigured] = useState(false);
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [isAsking, startAsking] = useTransition();

  useEffect(() => {
    if (!open) return;
    startLoading(async () => {
      const state = await getAssistantState();
      setConfigured(state.configured);
      setSuggestions(state.suggestions);
    });
  }, [open]);

  if (!open) return null;

  function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || isAsking) return;
    setError(null);
    setChat((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    startAsking(async () => {
      const result = await askAssistant(q);
      if (result.error) {
        setError(result.error);
        return;
      }
      setChat((prev) => [...prev, { role: "assistant", text: result.answer ?? "" }]);
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Asistente IA"
        className="fixed right-0 top-0 z-40 flex h-screen w-[360px] max-w-[90vw] flex-col gap-4 border-l border-edge p-5"
        style={{ background: "var(--panel-bg)", backdropFilter: "blur(28px)", animation: "slideIn 0.25s ease both" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-bold text-content">
            <Sparkles size={16} className="text-accent" />
            Asistente IA
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-strong text-content transition-colors hover:bg-surface"
          >
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-content-dim">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : !configured ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Settings size={28} className="text-content-dim" />
            <p className="text-sm text-content-muted">
              Conecta tu API key de Claude, GPT o Gemini para activar el Asistente.
            </p>
            <Link
              href="/configuracion"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
            >
              Ir a Configuración
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {suggestions.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 rounded-2xl border border-edge bg-surface-strong p-4">
                  <p className="text-[13px] leading-snug text-content">{s.text}</p>
                </div>
              ))}

              {chat.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-edge pt-3">
                  {chat.map((entry, i) => (
                    <div
                      key={i}
                      className={`rounded-xl px-3 py-2 text-[13px] leading-snug ${
                        entry.role === "user"
                          ? "self-end bg-primary-500/15 text-content"
                          : "self-start bg-surface-strong text-content"
                      }`}
                    >
                      {entry.text}
                    </div>
                  ))}
                  {isAsking && (
                    <div className="self-start rounded-xl bg-surface-strong px-3 py-2 text-content-dim">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                </div>
              )}
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <form onSubmit={handleAsk} className="flex items-center gap-2 rounded-xl border border-edge bg-surface-strong px-3 py-2.5">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pregúntale algo..."
                disabled={isAsking}
                className="flex-1 bg-transparent text-[13px] text-content outline-none placeholder:text-content-dim disabled:opacity-60"
              />
            </form>
          </>
        )}
      </aside>
    </>
  );
}
