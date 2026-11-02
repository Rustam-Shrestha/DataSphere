import type { ReactNode } from "react";
import { cn } from "@/utils";
import { AlertTriangleIcon, CheckCircle2, InfoIcon, XCircle, X } from "@assets/icons";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    container: "bg-[#E0F2FE] text-sky-950 border-sky-200",
    icon: <InfoIcon className="size-4 text-[#0284C7] shrink-0" />,
    title: "text-sky-950",
  },
  success: {
    container: "bg-[#DCFCE7] text-emerald-950 border-emerald-200",
    icon: <CheckCircle2 className="size-4 text-[#15803D] shrink-0" />,
    title: "text-emerald-950",
  },
  warning: {
    container: "bg-[#FEF3C7] text-amber-950 border-amber-200",
    icon: <AlertTriangleIcon className="size-4 text-[#D97706] shrink-0" />,
    title: "text-amber-950",
  },
  error: {
    container: "bg-[#FEE2E2] text-red-950 border-red-200",
    icon: <XCircle className="size-4 text-[#DC2626] shrink-0" />,
    title: "text-red-950",
  },
};

export function Alert({
  variant = "info",
  title,
  icon,
  onClose,
  children,
  className = "",
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-4 flex items-start gap-3 text-sm transition-all shadow-subtle",
        styles.container,
        className
      )}
    >
      <div className="mt-0.5">{icon || styles.icon}</div>
      <div className="flex-1">
        {title && <h4 className={cn("font-semibold text-sm mb-0.5", styles.title)}>{title}</h4>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          aria-label="Close alert"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
