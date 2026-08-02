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
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

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
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-ink-800 bg-ink-900">
      <div className="flex h-16 items-center gap-2 border-b border-ink-800/50 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo/freelancehub-symbol.png"
            alt="FreelanceHub"
            width={22}
            height={22}
            className="shrink-0"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-ink-50">
            FreelanceHub
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon, shortcut }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-fast",
                active
                  ? "bg-primary-500/15 font-medium text-ink-50"
                  : "text-ink-400 hover:bg-white/5 hover:text-ink-100"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-500" />
              )}
              <Icon size={18} className={active ? "text-primary-400" : ""} />
              <span className="flex-1">{label}</span>
              <span className="hidden text-[10px] text-ink-500 group-hover:inline">
                {shortcut}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-800/50 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-fast hover:bg-white/5">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-ink-400">Mi cuenta</span>
        </div>
      </div>
    </aside>
  );
}
