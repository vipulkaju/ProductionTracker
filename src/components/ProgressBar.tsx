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
    <div className={cn("w-full h-5 bg-[#f4f1ee] rounded-full overflow-hidden relative shadow-inner", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={cn(
          "h-full rounded-full transition-colors relative z-10",
          isDelayed ? "bg-[#ffafcc]" : isCompleted ? "bg-[#bdfedb]" : "bg-[#bde0fe]"
        )}
      />
      {/* Soft shine */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-white/20 z-20"
      />
    </div>
  );
}
