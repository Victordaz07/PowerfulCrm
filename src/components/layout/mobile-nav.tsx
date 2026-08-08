"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, KanbanSquare, Receipt, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/crm", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: KanbanSquare },
  { href: "/facturacion", label: "Facturas", icon: Receipt },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-800 bg-ink-900/95 backdrop-blur-md md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors duration-fast",
              active ? "text-primary-400" : "text-ink-500"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
