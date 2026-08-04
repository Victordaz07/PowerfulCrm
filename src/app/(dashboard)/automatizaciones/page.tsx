import { Zap } from "lucide-react";

// Stub visual (Fase 3 lo conecta a un modelo AutomationRule real +
// server actions). Reglas de ejemplo para mostrar el diseño.
const RULES = [
  {
    title: "Recordatorio automático de facturas vencidas",
    desc: "Envía un correo 3 días después del vencimiento.",
    enabled: true,
  },
  {
    title: "Seguimiento a leads inactivos",
    desc: "Notifica cuando un lead lleva 5+ días sin actividad.",
    enabled: true,
  },
  {
    title: "Sincronizar reuniones con Google Calendar",
    desc: "Crea eventos automáticamente al agendar llamadas.",
    enabled: true,
  },
  {
    title: "Backup semanal de contactos",
    desc: "Exporta tu lista de contactos cada lunes.",
    enabled: false,
  },
];

export default function AutomatizacionesPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
        >
          <Zap size={18} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-content">Automatizaciones</h1>
          <p className="text-sm text-content-muted">
            Reglas que trabajan por ti (vista previa — próximamente funcional).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {RULES.map((rule) => (
          <div
            key={rule.title}
            className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-5 backdrop-blur-md"
          >
            <div className="flex-1">
              <div className="text-sm font-bold text-content">{rule.title}</div>
              <div className="mt-0.5 text-[12.5px] text-content-muted">{rule.desc}</div>
            </div>
            <div
              className="relative h-[19px] w-[34px] shrink-0 rounded-full"
              style={{
                background: rule.enabled ? "oklch(70% 0.16 150 / 0.35)" : "var(--surface-strong)",
              }}
            >
              <div
                className="absolute top-[2.5px] h-3.5 w-3.5 rounded-full"
                style={{
                  left: rule.enabled ? "17px" : "2.5px",
                  background: rule.enabled ? "oklch(75% 0.16 150)" : "var(--content-dim)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
