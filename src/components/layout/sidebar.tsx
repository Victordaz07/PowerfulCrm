"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Receipt,
  CalendarDays,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/crm", label: "Clientes", icon: Users, shortcut: "G C" },
  { href: "/proyectos", label: "Proyectos", icon: KanbanSquare, shortcut: "G P" },
  { href: "/facturacion", label: "Facturación", icon: Receipt, shortcut: "G F" },
  { href: "/calendario", label: "Calendario", icon: CalendarDays, shortcut: "G A" },
  { href: "/automatizaciones", label: "Automatizaciones", icon: Zap, shortcut: "G U", badge: "3" },
  { href: "/configuracion", label: "Configuración", icon: Settings, shortcut: "G S" },
];

// Cuentas conectadas — Fase A: estado real via Clerk (user.externalAccounts).
// Las fases B/C/D consumen el token via src/lib/integrations.ts
// (getProviderToken) para sync real de calendario/correo/contactos.
const PROVIDERS: { key: "oauth_google" | "oauth_microsoft"; label: string }[] = [
  { key: "oauth_google", label: "Google Workspace" },
  { key: "oauth_microsoft", label: "Microsoft 365" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [pending, setPending] = useState<string | null>(null);

  async function handleConnect(strategy: "oauth_google" | "oauth_microsoft") {
    if (!user || pending) return;
    setPending(strategy);
    try {
      const externalAccount = await user.createExternalAccount({
        strategy,
        redirectUrl: window.location.href,
      });
      const redirectUrl = externalAccount.verification?.externalVerificationRedirectURL?.toString();
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
    } catch (err) {
      console.error("No se pudo iniciar la conexión de la cuenta", err);
    }
    setPending(null);
  }

  async function handleDisconnect(accountId: string) {
    if (!user || pending) return;
    setPending(accountId);
    try {
      const account = user.externalAccounts.find((a) => a.id === accountId);
      await account?.destroy();
      await user.reload();
    } catch (err) {
      console.error("No se pudo desconectar la cuenta", err);
    }
    setPending(null);
  }

  return (
    <aside
      className={cn(
        "hidden h-screen flex-shrink-0 flex-col gap-6 overflow-hidden border-r border-edge px-4 py-7 transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
      style={{ background: "var(--sidebar-bg)", backdropFilter: "blur(18px)" }}
    >
      <div className={cn("flex items-center gap-2.5 px-1.5", collapsed && "justify-center")}>
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo/freelancehub-symbol.png"
            alt="FreelanceHub"
            width={30}
            height={30}
            className="shrink-0 rounded-[9px]"
            priority
          />
          {!collapsed && (
            <span className="whitespace-nowrap text-[17px] font-extrabold tracking-tight text-content">
              FreelanceHub
            </span>
          )}
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, shortcut, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                collapsed && "justify-center",
                active
                  ? "bg-surface-strong font-semibold text-content"
                  : "text-content-muted hover:bg-surface hover:text-content"
              )}
            >
              <Icon size={18} className={cn("shrink-0", active && "text-accent")} />
              {!collapsed && <span className="flex-1 whitespace-nowrap">{label}</span>}
              {!collapsed && badge && (
                <span
                  className="ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                  style={{ background: "var(--accent-a-bg)", color: "var(--accent-a-text)" }}
                >
                  {badge}
                </span>
              )}
              {!collapsed && !badge && (
                <span className="hidden text-[10px] text-content-dim group-hover:inline">
                  {shortcut}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-edge bg-surface p-4">
          <div className="text-[12.5px] font-semibold text-content-muted">Cuentas conectadas</div>
          {PROVIDERS.map(({ key, label }) => {
            const account = user?.externalAccounts.find((a) => a.provider === key);
            const connected = !!account && account.verification?.status === "verified";
            const busy = pending === key || (!!account && pending === account.id);
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ background: connected ? "oklch(65% 0.15 150)" : "var(--content-dim)" }}
                />
                <span className="flex-1 text-[12.5px] text-content">{label}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => (connected && account ? handleDisconnect(account.id) : handleConnect(key))}
                  className="text-[11px] font-semibold disabled:opacity-60"
                  style={{ color: connected ? "oklch(65% 0.15 150)" : "oklch(72% 0.16 30)" }}
                >
                  {busy ? "..." : connected ? "Activo" : "Conectar"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className={cn("mt-auto flex flex-col gap-3", collapsed && "items-center")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
            collapsed && "justify-center px-0"
          )}
        >
          <UserButton afterSignOutUrl="/" />
          {!collapsed && <span className="text-sm text-content-muted">Mi cuenta</span>}
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border border-edge text-content-muted hover:bg-surface",
            collapsed ? "self-center" : "self-end"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
