import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { OrganizationSwitcher } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-800/60 bg-ink-950/80 px-4 backdrop-blur-md sm:px-6">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2 md:hidden">
        <Image
          src="/logo/freelancehub-symbol.png"
          alt="FreelanceHub"
          width={22}
          height={22}
          priority
        />
      </Link>

      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-400 transition-colors duration-fast hover:text-ink-100 sm:max-w-sm"
        data-command-trigger
      >
        <Search size={15} className="shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:inline">
          Buscar clientes, facturas…
        </span>
        <kbd className="ml-auto hidden rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <OrganizationSwitcher
        appearance={{
          elements: {
            organizationSwitcherTrigger:
              "text-sm text-ink-300 hover:text-ink-50 rounded-xl border border-ink-800 bg-ink-900 px-2 py-2 sm:px-3",
          },
        }}
      />
    </header>
  );
}
