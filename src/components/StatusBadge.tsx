import { cn } from "../lib/utils";
import { ProductionStatus } from "../types";

interface StatusBadgeProps {
  status: ProductionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<ProductionStatus, string> = {
    QUEUED: "bg-slate-100 text-slate-600 border-slate-200",
    IN_PROGRESS: "bg-indigo-50 text-indigo-600 border-indigo-200",
    QUALITY_CHECK: "bg-amber-50 text-amber-600 border-amber-200",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    DELAYED: "bg-rose-50 text-rose-600 border-rose-200",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider uppercase",
        statusStyles[status],
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
