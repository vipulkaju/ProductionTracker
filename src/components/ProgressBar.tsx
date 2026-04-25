import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface ProgressBarProps {
  progress: number;
  status?: string;
  className?: string;
}

export function ProgressBar({ progress, status, className }: ProgressBarProps) {
  const isDelayed = status === 'DELAYED';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className={cn("w-full h-1.5 bg-slate-100 rounded-full overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn(
          "h-full rounded-full transition-colors",
          isDelayed ? "bg-rose-500" : isCompleted ? "bg-emerald-500" : "bg-indigo-600"
        )}
      />
    </div>
  );
}
