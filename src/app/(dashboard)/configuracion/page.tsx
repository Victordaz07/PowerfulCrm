import { getTenantDb } from "@/lib/tenant";
import { Settings, ExternalLink, KeyRound } from "lucide-react";
import { AiKeyForm } from "@/components/configuracion/ai-key-form";

const cardClass = "rounded-2xl border border-edge bg-surface p-6 backdrop-blur-md";

const TUTORIALS = [
  {
    provider: "Anthropic (Claude)",
    url: "https://console.anthropic.com/settings/keys",
    steps: [
      "Entra a console.anthropic.com y crea una cuenta (o inicia sesión).",
      "En el menú lateral, ve a \"API Keys\".",
      "Dale a \"Create Key\", ponle un nombre y cópiala — empieza con sk-ant-.",
      "Pégala aquí abajo. Anthropic te cobra por separado según tu uso.",
    ],
  },
  {
    provider: "OpenAI (GPT)",
    url: "https://platform.openai.com/api-keys",
    steps: [
      "Entra a platform.openai.com y crea una cuenta (o inicia sesión).",
      "Ve a \"API keys\" en el menú de tu perfil.",
      "Dale a \"Create new secret key\" y cópiala — empieza con sk-.",
      "Pégala aquí abajo. OpenAI te cobra por separado según tu uso.",
    ],
  },
  {
    provider: "Google (Gemini)",
    url: "https://aistudio.google.com/app/apikey",
    steps: [
      "Entra a aistudio.google.com con tu cuenta de Google.",
      "Dale a \"Get API key\" → \"Create API key\".",
      "Copia la key generada — empieza con AIza.",
      "Pégala aquí abajo. Google tiene un nivel gratuito limitado, luego cobra por uso.",
    ],
  },
];

export default async function ConfiguracionPage() {
  const { db, tenantId } = await getTenantDb();
  // La tabla `tenants` no tiene RLS propia (es la raíz del modelo, no
  // tiene tenantId) — hay que filtrar por id a mano, findFirst() sin
  // where devolvería cualquier tenant de la base, no el actual.
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { aiProvider: true } });

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
        >
          <Settings size={18} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-content">Configuración</h1>
          <p className="text-sm text-content-muted">Conecta tu propia IA para el Asistente</p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} className="text-content-muted" />
          <h2 className="text-sm font-semibold text-content">API key de IA</h2>
        </div>
        <p className="mb-4 text-sm text-content-muted">
          El Asistente IA usa tu propia cuenta de Anthropic, OpenAI o Google — tú pagas directo al proveedor
          según tu uso, nosotros nunca vemos tu key en texto plano.
        </p>
        <AiKeyForm currentProvider={tenant?.aiProvider ?? null} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-content">Cómo sacar tu API key</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TUTORIALS.map((t) => (
            <div key={t.provider} className={cardClass}>
              <h3 className="mb-3 text-sm font-bold text-content">{t.provider}</h3>
              <ol className="space-y-2.5">
                {t.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-content-muted">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))" }}
                    >
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                Abrir {t.provider.split(" ")[0]} <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
