import Image from "next/image";
import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { CommandPalette } from "./command-palette";

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

      <CommandPalette />

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
