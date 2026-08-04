"use client";

import { Sparkles, X } from "lucide-react";

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

// Sugerencias de ejemplo. En la Fase 4 esto se alimenta de datos reales
// del tenant + un modelo (leads sin seguimiento, facturas por vencer, etc.).
const SUGGESTIONS = [
  { text: "3 leads llevan más de 5 días sin seguimiento.", action: "Contactar" },
  { text: "Sugerido: subir tu tarifa por hora un 8% este trimestre.", action: "Revisar" },
  { text: "Tienes facturas próximas a vencer esta semana.", action: "Enviar recordatorio" },
];

/**
 * Panel lateral del Asistente IA. Stub visual: la UI es real y navegable
 * pero las acciones aún no ejecutan nada (Fase 4). Se abre desde el botón
 * "Asistente IA" del header.
 */
export function AiAssistantPanel({ open, onClose }: AiAssistantPanelProps) {
  if (!open) return null;

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

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {SUGGESTIONS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-2xl border border-edge bg-surface-strong p-4"
            >
              <p className="text-[13px] leading-snug text-content">{s.text}</p>
              <button
                type="button"
                className="self-start rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
              >
                {s.action}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-strong px-3 py-2.5">
          <input
            placeholder="Pregúntale algo..."
            className="flex-1 bg-transparent text-[13px] text-content outline-none placeholder:text-content-dim"
          />
        </div>
      </aside>
    </>
  );
}
