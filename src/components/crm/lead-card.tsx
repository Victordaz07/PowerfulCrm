"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface LeadCardProps {
  title: string;
  clientName?: string | null;
  value?: number | null;
  index: number;
}

// Tarjeta de lead animada: entra con stagger según su posición en la
// columna y se levanta ligeramente al pasar el mouse — mismo patrón
// visual que se usará más adelante para el drag real (dnd-kit).
export function LeadCard({ title, clientName, value, index }: LeadCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, delay: Math.min(index, 6) * 0.03, ease: "easeOut" }}
    >
      <Card className="cursor-grab hover:border-ink-600 transition-colors duration-fast">
        <CardContent className="p-3">
          <p className="text-sm font-medium text-ink-100">{title}</p>
          <p className="text-xs text-ink-400">{clientName}</p>
          {value ? (
            <p className="mt-2 text-xs font-medium text-primary-400">{formatCurrency(value)}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
