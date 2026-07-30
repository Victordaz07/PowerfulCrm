"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Receipt,
  CalendarDays,
  Command,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/crm", label: "Clientes", icon: Users, shortcut: "G C" },
  { href: "/proyectos", label: "Proyectos", icon: KanbanSquare, shortcut: "G P" },
  { href: "/facturacion", label: "Facturación", icon: Receipt, shortcut: "G F" },
  { href: "/calendario", label: "Calendario", icon: CalendarDays, shortcut: "G A" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-ink-800 bg-ink-900">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm font-semibold tracking-tight text-ink-50">
          FreelanceHub
        </span>
        <OrganizationSwitcher
          appearance={{ elements: { organizationSwitcherTrigger: "text-xs text-ink-400" } }}
        />
      </div>

      <button
        className="mx-3 mb-3 flex items-center gap-2 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-400 hover:text-ink-100 transition-colors duration-fast"
        data-command-trigger
      >
        <Command size={14} />
        Buscar o crear…
        <kbd className="ml-auto rounded bg-ink-700 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <nav className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, shortcut }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-fast",
                active
                  ? "bg-ink-800 text-ink-50"
                  : "text-ink-400 hover:bg-ink-800/60 hover:text-ink-100"
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              <span className="hidden text-[10px] text-ink-500 group-hover:inline">
                {shortcut}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-ink-800 px-4 py-3">
        <UserButton afterSignOutUrl="/" />
        <span className="text-xs text-ink-400">Mi cuenta</span>
      </div>
    </aside>
  );
}
