"use client";

import { useState, useTransition } from "react";
import { toggleAutomation } from "@/app/(dashboard)/automatizaciones/actions";

/**
 * Switch on/off de una regla de automatización. Optimista: cambia el
 * estado visual al instante y lo persiste vía server action; si falla,
 * revierte.
 */
export function AutomationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const result = await toggleAutomation(id, next);
      if (result?.error) setOn(!next); // revierte si el server rechaza
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={isPending}
      aria-label={on ? "Desactivar automatización" : "Activar automatización"}
      className="relative h-[19px] w-[34px] shrink-0 rounded-full transition-colors disabled:opacity-60"
      style={{ background: on ? "oklch(70% 0.16 150 / 0.35)" : "var(--surface-strong)" }}
    >
      <span
        className="absolute top-[2.5px] h-3.5 w-3.5 rounded-full transition-[left]"
        style={{
          left: on ? "17px" : "2.5px",
          background: on ? "oklch(75% 0.16 150)" : "var(--content-dim)",
        }}
      />
    </button>
  );
}
