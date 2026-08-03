"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Loader2 } from "lucide-react";
import { searchGlobal, type SearchResult } from "@/app/(dashboard)/search-actions";

const GROUPS: SearchResult["group"][] = ["Clientes", "Facturas", "Proyectos", "Leads"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Atajo global ⌘K / Ctrl+K, estándar en apps de este tipo.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounce simple: espera 200ms de silencio antes de golpear el server.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchGlobal(q);
        setResults(r);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar clientes, facturas, proyectos o leads"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-400 transition-colors duration-fast hover:text-ink-100 sm:max-w-sm"
      >
        <Search size={15} className="shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:inline">
          Buscar clientes, facturas…
        </span>
        <kbd className="ml-auto hidden rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Búsqueda global"
        shouldFilter={false}
        overlayClassName="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-24 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-ink-800 px-4">
          <Search size={16} className="shrink-0 text-ink-500" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Buscar clientes, facturas, proyectos, leads…"
            className="w-full bg-transparent py-3.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          {isPending && <Loader2 size={14} className="shrink-0 animate-spin text-ink-500" />}
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-xs text-ink-500">
              Escribe al menos 2 letras para buscar.
            </p>
          ) : (
            <Command.Empty className="px-3 py-6 text-center text-xs text-ink-500">
              Sin resultados para &ldquo;{query}&rdquo;.
            </Command.Empty>
          )}

          {GROUPS.map((group) => {
            const items = results.filter((r) => r.group === group);
            if (items.length === 0) return null;
            return (
              <Command.Group
                key={group}
                heading={group}
                className="mb-1 px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-500"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink-100 data-[selected=true]:bg-primary-500/15"
                  >
                    <p className="truncate">{item.label}</p>
                    {item.sublabel && (
                      <p className="truncate text-xs text-ink-500">{item.sublabel}</p>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
