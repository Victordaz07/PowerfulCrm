"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Receipt,
  CalendarDays,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/crm", label: "Clientes", icon: Users, shortcut: "G C" },
  { href: "/proyectos", label: "Proyectos", icon: KanbanSquare, shortcut: "G P" },
  { href: "/facturacion", label: "Facturación", icon: Receipt, shortcut: "G F" },
  { href: "/calendario", label: "Calendario", icon: CalendarDays, shortcut: "G A" },
  { href: "/automatizaciones", label: "Automatizaciones", icon: Zap, shortcut: "G U", badge: "3" },
];

// Cuentas conectadas — stub visual (Fase 4 lo conecta a OAuth real).
const INTEGRATIONS = [
  { name: "Google Workspace", connected: true },
  { name: "Microsoft 365", connected: true },
  { name: "Apple iCloud", connected: false },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

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
          {INTEGRATIONS.map((acc) => (
            <div key={acc.name} className="flex items-center gap-2">
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: acc.connected ? "oklch(65% 0.15 150)" : "var(--content-dim)" }}
              />
              <span className="flex-1 text-[12.5px] text-content">{acc.name}</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: acc.connected ? "oklch(65% 0.15 150)" : "oklch(72% 0.16 30)" }}
              >
                {acc.connected ? "Activo" : "Conectar"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={cn("mt-auto flex flex-col gap-3", collapsed ? "items-center" : "items-stretch")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface",
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
            "flex h-7 w-7 items-center justify-center rounded-lg border border-edge bg-surface text-content transition-colors hover:bg-surface-strong",
            collapsed ? "self-center" : "self-end"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
