import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-[#DCFCE7] text-[#15803D] border-emerald-200",
  success: "bg-[#DCFCE7] text-[#16A34A] border-emerald-200",
  warning: "bg-[#FEF3C7] text-[#D97706] border-amber-200",
  danger: "bg-[#FEE2E2] text-[#DC2626] border-red-200",
  info: "bg-[#E0F2FE] text-[#0284C7] border-sky-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-0.5 text-xs gap-1.5",
};

export function Badge({
  variant = "default",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border select-none leading-normal",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
