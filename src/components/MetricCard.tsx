import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  variant?: "indigo" | "emerald" | "amber" | "rose";
}

export function MetricCard({ label, value, change, trend, icon: Icon, variant = "indigo" }: MetricCardProps) {
  const variantStyles = {
    indigo: "text-blue-600 bg-[#bde0fe]/40 border-white/60",
    emerald: "text-emerald-600 bg-[#bdfedb]/50 border-white/60",
    amber: "text-amber-600 bg-[#fbefcc]/60 border-white/60",
    rose: "text-rose-600 bg-[#fedbdc]/50 border-white/60"
  };

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.5 } }}
      className="p-8 bg-[#fcfaf8] rounded-[3.5rem] shadow-soft transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-8">
        <div className={cn(
          "p-5 rounded-[2rem] transition-transform group-hover:scale-110 duration-700 border soft-shadow-sm",
          variantStyles[variant]
        )}>
          <Icon className="w-8 h-8" />
        </div>
        <div
          className={cn(
            "text-[11px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-2xl bg-white shadow-soft-sm",
            trend === "up" ? "text-emerald-500" : 
            trend === "down" ? "text-rose-400" : 
            "text-slate-300"
          )}
        >
          {change > 0 ? "+" : change < 0 ? "-" : ""} {Math.abs(change)}%
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-4">{label}</p>
        <h3 className="text-4xl sm:text-5xl font-black text-slate-800 font-display tracking-tighter">{value}</h3>
      </div>
    </motion.div>
  );
}
