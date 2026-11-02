import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: "green" | "blue" | "amber" | "red" | "slate";
  className?: string;
}

const colorStyles = {
  green: {
    bg: "bg-[#DCFCE7]",
    text: "text-[#15803D]",
    border: "border-emerald-200",
  },
  blue: {
    bg: "bg-[#E0F2FE]",
    text: "text-[#0284C7]",
    border: "border-sky-200",
  },
  amber: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    border: "border-amber-200",
  },
  red: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#DC2626]",
    border: "border-red-200",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

export function StatsCard({
  label,
  value,
  icon,
  description,
  trend,
  accentColor = "green",
  className = "",
}: StatsCardProps) {
  const styles = colorStyles[accentColor];

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-6 shadow-subtle transition-all duration-150 hover:border-slate-300",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-md border flex items-center justify-center shrink-0", styles.bg, styles.text, styles.border)}>
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-900 mt-3 tracking-tight tabular-nums font-sans">
        {value}
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-semibold px-1.5 py-0.5 rounded text-[11px] tabular-nums",
                trend.isPositive ? "text-[#15803D] bg-[#DCFCE7]" : "text-[#DC2626] bg-[#FEE2E2]"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {trend?.label && <span className="text-slate-500">{trend.label}</span>}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
