import { cn } from "@/utils";
import { CheckCircle2, XCircle, Clock, AlertTriangleIcon } from "@assets/icons";

export interface StatusBadgeProps {
  status: string | null | undefined;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className = "" }: StatusBadgeProps) {
  const norm = (status ?? "").trim().toUpperCase();

  if (!norm || norm === "-" || norm === "NONE" || norm === "NULL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 select-none",
          className
        )}
      >
        {showIcon && <Clock className="size-3.5 text-slate-400 shrink-0" />}
        <span>N/A</span>
      </span>
    );
  }

  if (norm === "PASS") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-emerald-200 select-none",
          className
        )}
      >
        {showIcon && <CheckCircle2 className="size-3.5 text-[#15803D] shrink-0" />}
        <span>PASS</span>
      </span>
    );
  }

  if (norm === "FAIL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-red-200 select-none",
          className
        )}
      >
        {showIcon && <XCircle className="size-3.5 text-[#DC2626] shrink-0" />}
        <span>FAIL</span>
      </span>
    );
  }

  // Pending / Warning / Custom
  const isPending = norm.includes("PEND");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none",
        isPending
          ? "bg-[#FEF3C7] text-[#D97706] border-amber-200"
          : "bg-slate-100 text-slate-700 border-slate-200",
        className
      )}
    >
      {showIcon && (
        isPending ? (
          <Clock className="size-3.5 text-[#D97706] shrink-0" />
        ) : (
          <AlertTriangleIcon className="size-3.5 text-slate-500 shrink-0" />
        )
      )}
      <span>{status}</span>
    </span>
  );
}
