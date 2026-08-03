"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface IncomeTrendChartProps {
  data: { month: string; total: number; previousTotal?: number }[];
  currency: string;
  showComparison?: boolean;
}

function formatShort(value: number, currency: string) {
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: value >= 1000 ? "compact" : "standard",
  });
  return formatter.format(value);
}

export function IncomeTrendChart({ data, currency, showComparison }: IncomeTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2D3748" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#A0AEC0"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#A0AEC0"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatShort(v, currency)}
          width={64}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatShort(value, currency),
            name === "previousTotal" ? "Mismo mes, año anterior" : "Ingresos",
          ]}
          contentStyle={{
            background: "#161D31",
            border: "1px solid #2D3748",
            borderRadius: 8,
            fontSize: 12,
            color: "#F8FAFC",
          }}
          labelStyle={{ color: "#A0AEC0" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#7C3AED"
          strokeWidth={2.5}
          fill="url(#incomeFill)"
        />
        {showComparison && (
          <Line
            type="monotone"
            dataKey="previousTotal"
            stroke="#A0AEC0"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
