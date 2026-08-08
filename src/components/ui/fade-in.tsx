"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Wrapper genérico de entrada (fade + slide sutil) para paneles del
// dashboard y otras secciones estáticas renderizadas en el servidor.
// Server Components pueden pasarle JSX como children sin problema —
// solo este wrapper necesita "use client" para animar con motion.
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
