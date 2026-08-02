"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: { label: string; value: number }[];
  tone?: "amber" | "success";
}

const TONE_COLORS: Record<NonNullable<MiniSparklineProps["tone"]>, string> = {
  amber: "#D6820F",
  success: "#2F9E67",
};

export function MiniSparkline({ data, tone = "amber" }: MiniSparklineProps) {
  const color = TONE_COLORS[tone];
  const gradientId = `spark-${tone}`;

  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
