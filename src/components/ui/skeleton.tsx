import { cn } from "@/lib/utils";

// Placeholder de carga genérico — se usa en los archivos loading.tsx
// de cada ruta del dashboard (Next.js los muestra automáticamente
// como fallback de Suspense mientras el Server Component carga datos).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface", className)} />;
}
