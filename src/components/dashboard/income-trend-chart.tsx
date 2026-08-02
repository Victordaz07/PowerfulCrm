"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface IncomeTrendChartProps {
  data: { month: string; total: number }[];
  currency: string;
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

export function IncomeTrendChart({ data, currency }: IncomeTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6820F" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#D6820F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#262C3A" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#8B93A6"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#8B93A6"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatShort(v, currency)}
          width={64}
        />
        <Tooltip
          formatter={(value: number) => [formatShort(value, currency), "Ingresos"]}
          contentStyle={{
            background: "#1B202C",
            border: "1px solid #262C3A",
            borderRadius: 8,
            fontSize: 12,
            color: "#F0F2F5",
          }}
          labelStyle={{ color: "#8B93A6" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#D6820F"
          strokeWidth={2.5}
          fill="url(#incomeFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
