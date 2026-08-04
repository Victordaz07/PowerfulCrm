"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onAiToggle: () => void;
}

export function Header({ onAiToggle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-edge px-4 backdrop-blur-md sm:px-6"
      style={{ background: "var(--panel-bg)" }}
    >
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2 md:hidden">
        <Image src="/logo/freelancehub-symbol.png" alt="FreelanceHub" width={22} height={22} priority />
      </Link>

      <CommandPalette />

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <button
          type="button"
          onClick={onAiToggle}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold text-white transition-[filter] hover:brightness-110 sm:px-4"
          style={{
            background: "linear-gradient(135deg, var(--accent-a), var(--accent-b))",
            boxShadow: "0 6px 20px var(--accent-a-shadow)",
          }}
        >
          <Sparkles size={15} />
          <span className="hidden sm:inline">Asistente IA</span>
        </button>

        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger:
                "text-sm text-content-muted hover:text-content rounded-xl border border-edge bg-surface px-2 py-2 sm:px-3",
            },
          }}
        />
      </div>
    </header>
  );
}
