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
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100"
  };

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="p-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500 border",
          variantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl",
            trend === "up" ? "bg-emerald-50 text-emerald-600" : 
            trend === "down" ? "bg-rose-50 text-rose-600" : 
            "bg-slate-50 text-slate-500"
          )}
        >
          {change > 0 ? "+" : change < 0 ? "-" : ""} {Math.abs(change)}%
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] leading-none mb-3">{label}</p>
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">{value}</h3>
      </div>
      
      {/* Subtle decorative element */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />
    </motion.div>
  );
}
