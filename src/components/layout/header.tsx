import { Search } from "lucide-react";
import { OrganizationSwitcher } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink-800/60 bg-ink-950/80 px-6 backdrop-blur-md">
      <button
        className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-400 transition-colors duration-fast hover:text-ink-100"
        data-command-trigger
      >
        <Search size={15} className="shrink-0" />
        <span className="flex-1 text-left">Buscar clientes, facturas…</span>
        <kbd className="hidden rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <OrganizationSwitcher
        appearance={{
          elements: {
            organizationSwitcherTrigger:
              "text-sm text-ink-300 hover:text-ink-50 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2",
          },
        }}
      />
    </header>
  );
}
