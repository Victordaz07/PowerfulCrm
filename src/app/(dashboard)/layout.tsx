import { AppShell } from "@/components/layout/app-shell";

// Todas las páginas de este grupo dependen de auth() (vía getTenantDb())
// y de datos por-tenant en cada request -- nunca deben prerenderizarse
// estáticamente. En Next 14 esto quedaba implícito porque el uso de
// cookies()/headers() dentro de Clerk forzaba el bail-out automático,
// pero el análisis estático de Turbopack en Next 16 intenta prerenderizar
// antes de detectarlo, y sin las env vars de Clerk en build time eso
// revienta con "Missing publishableKey". Declarar force-dynamic explícito
// es la forma correcta y robusta de evitarlo, no un parche del entorno.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
