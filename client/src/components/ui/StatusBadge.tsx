import { cn } from "@/utils";
import { CheckCircle2, XCircle, Clock, AlertTriangleIcon } from "@assets/icons";

export interface StatusBadgeProps {
  status: string | null | undefined;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className = "" }: StatusBadgeProps) {
  const norm = (status ?? "").trim().toUpperCase();

  if (!norm || norm === "-" || norm === "NONE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200/80",
          className
        )}
      >
        {showIcon && <Clock className="size-3.5 text-gray-400" />}
        <span>N/A</span>
      </span>
    );
  }

  if (norm === "PASS") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs",
          className
        )}
      >
        {showIcon && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
        <span>PASS</span>
      </span>
    );
  }

  if (norm === "FAIL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs",
          className
        )}
      >
        {showIcon && <XCircle className="size-3.5 text-rose-600 shrink-0" />}
        <span>FAIL</span>
      </span>
    );
  }

  // Any other status (Pending, Overdue, Custom)
  const isPending = norm.includes("PEND");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
        isPending
          ? "bg-amber-50 text-amber-700 border-amber-200/80"
          : "bg-slate-100 text-slate-700 border-slate-200",
        className
      )}
    >
      {showIcon && (
        isPending ? <Clock className="size-3.5 text-amber-600 shrink-0" /> : <AlertTriangleIcon className="size-3.5 text-slate-500 shrink-0" />
      )}
      <span>{status}</span>
    </span>
  );
}
