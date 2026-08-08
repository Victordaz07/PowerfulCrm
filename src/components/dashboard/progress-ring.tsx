import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percent: number;
  label: string;
  tone?: "primary" | "success";
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const TONE_STROKE: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  primary: "stroke-primary-500",
  success: "stroke-success",
};

export function ProgressRing({
  percent,
  label,
  tone = "primary",
  size = 120,
  strokeWidth = 10,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-edge"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", TONE_STROKE[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-content">{clamped}%</span>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
