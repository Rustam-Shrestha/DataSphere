import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  items,
  activeId,
  onChange,
  variant = "pill",
  className = "",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("flex border-b border-slate-200 gap-6", className)}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-all relative flex items-center gap-2 cursor-pointer",
                isActive
                  ? "text-[#15803D] font-semibold border-b-2 border-[#15803D] -mb-px"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.icon && <span className="size-4 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center p-1 bg-slate-100 rounded-lg gap-1 border border-slate-200", className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer select-none",
              isActive
                ? "bg-white text-slate-900 shadow-subtle border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            {tab.icon && (
              <span className={cn("size-4 shrink-0", isActive ? "text-[#15803D]" : "text-slate-400")}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums",
                  isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-200 text-slate-700"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
