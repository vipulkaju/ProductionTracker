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
    <div className={cn("w-full h-2 bg-slate-100/50 rounded-full overflow-hidden relative", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={cn(
          "h-full rounded-full transition-colors relative z-10 shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)]",
          isDelayed ? "bg-rose-500 shadow-rose-200" : isCompleted ? "bg-emerald-500 shadow-emerald-200" : "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-100"
        )}
      />
      {/* Shine effect */}
      <motion.div 
        initial={{ left: "-100%" }}
        animate={{ left: "100%" }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        className="absolute top-0 bottom-0 w-20 bg-white/30 skew-x-12 z-20"
      />
    </div>
  );
}
