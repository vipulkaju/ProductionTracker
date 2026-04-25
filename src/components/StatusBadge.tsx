import { cn } from "../lib/utils";
import { ProductionStatus } from "../types";

interface StatusBadgeProps {
  status: ProductionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<ProductionStatus, string> = {
    QUEUED: "bg-slate-100 text-slate-600 border-slate-200 shadow-sm shadow-slate-100",
    IN_PROGRESS: "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm shadow-indigo-100 animate-pulse",
    QUALITY_CHECK: "bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100",
    DELAYED: "bg-rose-50 text-rose-600 border-rose-200 shadow-sm shadow-rose-100",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-lg text-[9px] font-black border tracking-[0.15em] uppercase transition-all duration-300",
        statusStyles[status],
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
