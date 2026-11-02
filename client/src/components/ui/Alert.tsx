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
    container: "bg-blue-50/80 text-blue-900 border-blue-200",
    icon: <InfoIcon className="size-4 text-blue-600 shrink-0" />,
    title: "text-blue-900",
  },
  success: {
    container: "bg-emerald-50/80 text-emerald-900 border-emerald-200",
    icon: <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />,
    title: "text-emerald-900",
  },
  warning: {
    container: "bg-amber-50/80 text-amber-900 border-amber-200",
    icon: <AlertTriangleIcon className="size-4 text-amber-600 shrink-0" />,
    title: "text-amber-900",
  },
  error: {
    container: "bg-rose-50/80 text-rose-900 border-rose-200",
    icon: <XCircle className="size-4 text-rose-600 shrink-0" />,
    title: "text-rose-900",
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
        "rounded-xl border p-4 flex items-start gap-3 text-sm transition-all shadow-2xs",
        styles.container,
        className
      )}
    >
      <div className="mt-0.5">{icon || styles.icon}</div>
      <div className="flex-1">
        {title && <h4 className={cn("font-semibold font-heading mb-0.5", styles.title)}>{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
