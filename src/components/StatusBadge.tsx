import { cn } from "../lib/utils";
import { ProductionStatus } from "../types";
import { motion } from "motion/react";

interface StatusBadgeProps {
  status: ProductionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<ProductionStatus, string> = {
    QUEUED: "bg-slate-100/50 text-slate-400 soft-shadow-sm",
    IN_PROGRESS: "bg-[#bde0fe] text-blue-800 soft-shadow-sm",
    QUALITY_CHECK: "bg-[#fbefcc] text-amber-800 soft-shadow-sm",
    COMPLETED: "bg-[#bdfedb] text-emerald-800 soft-shadow-sm",
    DELAYED: "bg-[#fedbdc] text-rose-800 soft-shadow-sm",
  };

  return (
    <span
      className={cn(
        "px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-3xl text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-700 flex items-center justify-center gap-2 sm:gap-3",
        statusStyles[status],
        className
      )}
    >
      <motion.div 
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [1, 0.4, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          status === 'QUEUED' ? "bg-slate-300" : "bg-current opacity-40"
        )} 
      />
      <span className="whitespace-nowrap italic">{status.replace('_', ' ')}</span>
    </span>
  );
}
