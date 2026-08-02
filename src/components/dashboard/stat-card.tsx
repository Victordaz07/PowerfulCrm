import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  iconTone?: "success" | "primary" | "warning" | "danger" | "neutral";
  trend?: { value: string; direction: "up" | "down"; tone?: "success" | "danger" | "neutral" };
  hint?: string;
  valueTone?: "default" | "danger";
  className?: string;
}

const ICON_TONE_STYLES: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  success: "bg-success/15 text-success",
  primary: "bg-primary-500/15 text-primary-400",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-ink-700 text-ink-300",
};

const TREND_TONE_STYLES: Record<NonNullable<NonNullable<StatCardProps["trend"]>["tone"]>, string> = {
  success: "text-success",
  danger: "text-danger",
  neutral: "text-ink-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  iconTone = "primary",
  trend,
  hint,
  valueTone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-800/60 bg-ink-900/70 p-5 backdrop-blur-md",
        className
      )}
    >
      {Icon ? (
        <div className="flex items-center gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", ICON_TONE_STYLES[iconTone])}>
            <Icon size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-xs text-ink-400">{label}</p>
            <p className={cn("text-2xl font-semibold num", valueTone === "danger" ? "text-danger" : "text-ink-50")}>
              {value}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-400">{label}</p>
          <p className={cn("text-lg font-semibold num", valueTone === "danger" ? "text-danger" : "text-ink-50")}>
            {value}
          </p>
        </>
      )}
      {trend && (
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-[11px]",
            TREND_TONE_STYLES[trend.tone ?? "neutral"]
          )}
        >
          {trend.direction === "up" ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
          {trend.value}
        </span>
      )}
      {hint && !trend && <span className="mt-2 inline-block text-[11px] text-ink-500">{hint}</span>}
    </div>
  );
}
