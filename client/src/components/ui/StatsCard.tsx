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
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
  },
  red: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-100",
  },
  slate: {
    bg: "bg-slate-50",
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
        "bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs transition-all duration-200 hover:border-gray-300 hover:shadow-soft",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-mono">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg border flex items-center justify-center shrink-0", styles.bg, styles.text, styles.border)}>
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-gray-900 mt-2 font-heading tracking-tight">
        {value}
      </div>

      {(trend || description) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {trend?.label && <span className="text-gray-500">{trend.label}</span>}
          {description && <span className="text-gray-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
