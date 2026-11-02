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
      <div className={cn("flex border-b border-gray-200 gap-6", className)}>
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
                  ? "text-[#166534] font-semibold border-b-2 border-[#166534] -mb-px"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {tab.icon && <span className="size-4 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-semibold">
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
    <div className={cn("inline-flex items-center p-1 bg-gray-100/90 rounded-xl gap-1 border border-gray-200/60", className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer select-none",
              isActive
                ? "bg-white text-gray-900 shadow-xs border border-gray-200/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            {tab.icon && <span className={cn("size-4 shrink-0", isActive ? "text-[#166534]" : "text-gray-400")}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-bold", isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-200/70 text-gray-700")}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
