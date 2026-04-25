import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
}

export function MetricCard({ label, value, change, trend, icon: Icon }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3"
    >
      <div className="flex justify-between items-start">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
        <div
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
            trend === "up" ? "bg-emerald-50 text-emerald-600" : 
            trend === "down" ? "bg-rose-50 text-rose-600" : 
            "bg-slate-50 text-slate-600"
          )}
        >
          {change > 0 ? "+" : ""}{change}%
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <h3 className="text-xl sm:text-3xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
