"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/portal/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard puede fallar por permisos del navegador — no hay mucho
      // más que hacer que dejar el botón como estaba.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copiar link de pago para el cliente"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-content-muted transition-colors hover:bg-surface hover:text-content"
    >
      {copied ? <Check size={13} className="text-success" /> : <Link2 size={13} />}
      {copied ? "Copiado" : "Link"}
    </button>
  );
}
