"use client";

import { Sun, Moon } from "lucide-react";

/**
 * Alterna el tema claro/oscuro. El estado real vive en la clase `.dark`/
 * `.light` de <html> (la fija el server desde la cookie `theme`). Este
 * botón lee esa clase al hacer clic, la invierte al instante y persiste
 * la elección en la cookie, así el próximo SSR arranca con el tema
 * correcto — sin FOUC ni script inline (que el CSP estricto bloquearía).
 *
 * El icono no usa estado de React: se muestra Sol u Luna con el variant
 * `dark:` de Tailwind, así siempre coincide con la clase de <html> sin
 * riesgo de desajuste de hidratación.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.classList.contains("light") ? "dark" : "light";
    root.classList.remove("light", "dark");
    root.classList.add(next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-surface text-content transition-colors hover:bg-surface-strong"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </button>
  );
}
