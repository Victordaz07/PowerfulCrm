"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { AppBackground } from "./app-background";
import { AiAssistantPanel } from "./ai-assistant-panel";

/**
 * Shell del área autenticada. Client component porque coordina estado de
 * UI compartido entre sidebar y header (colapso del menú, panel IA). Las
 * páginas (server components) llegan por `children` y renderizan igual.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden">
      <AppBackground />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onAiToggle={() => setAiOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
      <AiAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
