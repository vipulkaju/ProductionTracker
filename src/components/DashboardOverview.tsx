import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ProductionItem, ProductionRecord } from '../types';
import { Activity, Clock, Zap, Target, Layers, TrendingUp, Trophy, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, subDays } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardOverviewProps {
  items: ProductionItem[];
  user: any;
  onMachineSelect?: (id: string) => void;
}

export function DashboardOverview({ items, user, onMachineSelect }: DashboardOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({
    totalStitches: 0,
    totalMeters: 0,
    activeMachines: 0,
    totalMachines: 0
  });
  const [topOperator, setTopOperator] = useState<{name: string, machineId: string, stitches: number} | null>(null);

  const selectedDate = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const dateFormatted = useMemo(() => format(subDays(new Date(), 1), 'EEEE, MMM do, yyyy'), []);

  useEffect(() => {
    const fetchYesterdayStats = async () => {
      if (!user || items.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      let stitches = 0;
      let meters = 0;
      let activeCount = 0;
      let maxStitches = 0;
      let bestOperator: {name: string, machineId: string, stitches: number} | null = null;

      for (const machine of items) {
        const logsRef = collection(db, 'machines', machine.id, 'logs');
        const q = query(
          logsRef, 
          where('date', '==', selectedDate),
          where('userId', '==', user.uid)
        );
        
        try {
          const logSnap = await getDocs(q);
          if (!logSnap.empty) {
            activeCount++;
            logSnap.forEach(doc => {
              const data = doc.data() as ProductionRecord;
              stitches += (data.totalStitches || 0);
              meters += (data.totalMeters || 0);
              
              if ((data.totalStitches || 0) > maxStitches && data.operatorName) {
                maxStitches = data.totalStitches;
                bestOperator = {
                  name: data.operatorName,
                  machineId: machine.id,
                  stitches: data.totalStitches
                };
              }
            });
          }
        } catch (error) {
          console.error("Error fetching logs for machine", machine.id, error);
        }
      }

      setDailyStats({
        totalStitches: stitches,
        totalMeters: meters,
        activeMachines: activeCount,
        totalMachines: items.length
      });
      setTopOperator(bestOperator);
      
      setLoading(false);
    };

    fetchYesterdayStats();
  }, [items, user, selectedDate]);

  const utilization = dailyStats.totalMachines === 0 ? 0 : Math.round((dailyStats.activeMachines / dailyStats.totalMachines) * 100);
  const circumference = 2 * Math.PI * 120; // radius 120
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 w-full flex flex-col relative overflow-y-auto overflow-x-hidden bg-[#f4f6f8]"
    >
      {/* Background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-slate-200/50 rounded-full blur-[120px] mix-blend-multiply" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] bg-stone-200/40 rounded-full blur-[120px] mix-blend-multiply" />
         <div className="absolute top-[20%] right-[30%] w-[40%] h-[40%] bg-gray-200/40 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      {/* Decorative glassy arc */}
      <div className="absolute -left-[50%] sm:-left-[20%] top-1/2 -translate-y-1/2 pointer-events-none w-[800px] h-[800px] sm:w-[1200px] sm:h-[1200px] z-0 opacity-50">
        <svg width="100%" height="100%" viewBox="0 0 300 300" className="-rotate-90 drop-shadow-2xl">
           <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="25" />
           <motion.circle
             cx="150" cy="150" r="120" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="25" strokeLinecap="round"
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             style={{ strokeDasharray: circumference }}
           />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col min-h-full p-6 pb-28 sm:p-12 w-full max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start w-full">
             <div>
               <h2 className="text-lg sm:text-xl font-light text-slate-400 tracking-[0.3em] uppercase">Nexus</h2>
               <h3 className="text-xl sm:text-2xl font-light text-slate-800 tracking-[0.2em] uppercase mt-1">Production</h3>
             </div>
             <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Yesterday's Yield</p>
                <h3 className="text-4xl sm:text-6xl font-extralight text-slate-800 tracking-tighter mt-1 sm:mt-2">
                  {dailyStats.totalStitches.toLocaleString()}
                </h3>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-2 sm:mt-3 tracking-[0.2em] uppercase">Goal 10M sts</p>
             </div>
          </div>

          {/* Center layout */}
          <div className="flex-1 flex flex-col sm:flex-row items-center w-full mt-6 sm:mt-8 gap-8 sm:gap-0">
            {/* Left side (Percentage) */}
            <div className="flex-1 flex items-center justify-center sm:justify-start sm:pl-16">
              <div className="flex flex-col items-center">
                <h3 className="text-7xl sm:text-9xl lg:text-[11rem] font-extralight text-slate-800 tracking-tighter leading-none drop-shadow-sm">{utilization}%</h3>
                <p className="text-[10px] sm:text-xs font-light text-slate-500 uppercase tracking-[0.4em] mt-4 sm:mt-6 bg-white/40 px-5 sm:px-8 py-2 sm:py-3 rounded-full border border-white/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">Active Fleet</p>
              </div>
            </div>

            {/* Right side (Stats) */}
            <div className="flex-1 flex flex-col items-center sm:items-end justify-center gap-8 sm:gap-12 text-center sm:text-right pr-0 sm:pr-12 w-full">
              <div className="bg-white/30 backdrop-blur-lg border border-white/50 p-4 sm:p-6 rounded-3xl w-full sm:w-auto min-w-[280px]">
                <p className="text-3xl sm:text-5xl font-light text-slate-700 leading-none">{dailyStats.totalMeters.toLocaleString()}</p>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-2 sm:mt-3">Total Meters</p>
              </div>
              
              <div className="bg-white/30 backdrop-blur-lg border border-white/50 p-4 sm:p-6 rounded-3xl w-full sm:w-auto min-w-[280px]">
                <p className="text-3xl sm:text-5xl font-light text-slate-700 leading-none">
                   {dailyStats.activeMachines} <span className="text-2xl sm:text-3xl text-slate-400 font-extralight">/ {dailyStats.totalMachines}</span>
                </p>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-2 sm:mt-3">Machines Active</p>
              </div>
              
              <div className="bg-white/30 backdrop-blur-lg border border-white/50 p-4 sm:p-6 rounded-3xl w-full sm:w-auto min-w-[280px]">
                <p className="text-3xl sm:text-5xl font-light text-slate-700 leading-none">
                  {dailyStats.activeMachines > 0 ? Math.round(dailyStats.totalStitches / dailyStats.activeMachines).toLocaleString() : 0}
                </p>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-2 sm:mt-3">Avg per Machine</p>
              </div>
            </div>
          </div>

          {/* Bottom Operator Bar */}
          <div className="mt-auto pt-6 sm:pt-10">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 if (topOperator && onMachineSelect) {
                   onMachineSelect(topOperator.machineId);
                 }
               }}
               className="relative z-20 pointer-events-auto w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:bg-white/60 active:scale-[0.98] transition-all cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.03)] group"
             >
               <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/60 backdrop-blur-xl border border-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                   <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-slate-600" strokeWidth={1.2} />
                 </div>
                 <div className="text-left flex-1">
                   <h3 className="text-xl sm:text-3xl font-light text-slate-800 uppercase tracking-[0.1em] leading-none line-clamp-1">
                     {topOperator ? topOperator.name : 'No Data'}
                   </h3>
                   <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-1.5 sm:mt-2">Top Performing Karigar</p>
                 </div>
               </div>

               <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/40 sm:border-transparent pt-4 sm:pt-0">
                  <div className="flex flex-col text-left sm:text-right">
                     <span className="text-2xl sm:text-4xl font-light text-slate-700 leading-none">
                       {topOperator ? topOperator.stitches.toLocaleString() : '-'}
                     </span>
                     <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-1.5 sm:mt-2">Stitches</span>
                  </div>
                  
                  {topOperator && (
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
               </div>
             </button>
          </div>
      </div>
    </motion.div>
  );
}
