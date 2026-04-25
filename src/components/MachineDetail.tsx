import React, { useMemo } from 'react';
import { ProductionItem, ProductionRecord } from '../types';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Activity, 
  Hash, 
  Plus,
  Clock,
  LayoutDashboard,
  Layers,
  Ruler
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

interface MachineDetailProps {
  item: ProductionItem;
  onBack: () => void;
  key?: React.Key;
}

export function MachineDetail({ item, onBack }: MachineDetailProps) {
  const logs = item.productionLogs || [];

  const logsByDate = useMemo(() => {
    const groups: Record<string, { DAY?: ProductionRecord; NIGHT?: ProductionRecord }> = {};
    logs.forEach(log => {
      if (!groups[log.date]) {
        groups[log.date] = {};
      }
      groups[log.date][log.shift] = log;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-12"
    >
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{item.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-slate-400">{item.id}</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.category}</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <StatusBadge status={item.status} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Progress</p>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-black text-slate-800">{item.progress}%</span>
              <span className="text-xs font-bold text-slate-400">Target Reached</span>
            </div>
            <ProgressBar progress={item.progress} status={item.status} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-slate-800">{logs.length}</span>
              <span className="text-xs font-bold text-emerald-600">Active Entries</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Machine Head: {item.machineHead || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="block text-xs font-black text-slate-800 uppercase">Started: {formatDate(item.startDate)}</span>
                <span className="block text-xs font-black text-rose-600 uppercase">Due: {formatDate(item.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production History Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-tight">Production History (પ્રોડક્શન નો હિસાબ)</h3>
          <div className="flex-1 h-px bg-slate-200 ml-4" />
        </div>

        {logsByDate.length > 0 ? (
          <div className="space-y-12">
            {logsByDate.map(([date, shifts]) => (
              <div key={date} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    {formatDate(date)}
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ShiftSideCard 
                    shift="DAY" 
                    log={shifts.DAY} 
                    title="Day Shift (દિવસ)"
                    accentColor="amber"
                  />
                  <ShiftSideCard 
                    shift="NIGHT" 
                    log={shifts.NIGHT} 
                    title="Night Shift (રાત)"
                    accentColor="slate"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 bg-white border border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <Plus className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-black text-slate-800 uppercase text-sm tracking-widest">No entries yet</p>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wide">Add your first production log to see it here</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}

interface ShiftSideCardProps {
  shift: 'DAY' | 'NIGHT';
  log?: ProductionRecord;
  title: string;
  accentColor: 'amber' | 'slate';
}

function ShiftSideCard({ shift, log, title, accentColor }: ShiftSideCardProps) {
  if (!log) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group transition-all opacity-40 grayscale">
        <Clock className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">No entry for this shift</p>
      </div>
    );
  }

  const isDay = shift === 'DAY';

  return (
    <div className={cn(
      "relative bg-white border-2 rounded-[2.5rem] overflow-hidden transition-all shadow-sm",
      isDay ? "border-amber-100 hover:border-amber-400" : "border-slate-100 hover:border-slate-800 shadow-slate-100"
    )}>
      {/* Header */}
      <div className={cn(
        "px-6 py-4 flex justify-between items-center border-b",
        isDay ? "bg-amber-50/50 border-amber-100" : "bg-slate-900 border-slate-900 text-white"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            isDay ? "bg-amber-400 text-white" : "bg-slate-700 text-white"
          )}>
            {isDay ? <Clock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
              <User className="w-3 h-3" />
              <span className="text-xs font-black uppercase">{log.operatorName}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">Design</p>
          <p className="text-sm font-black uppercase tracking-tight">{log.designName}</p>
        </div>
      </div>

      {/* Body Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tich (Stitch)</p>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-lg font-black text-slate-800">{log.designStitch.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Frame</p>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-lg font-black text-slate-800">{log.frame}</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-50 pt-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meter</p>
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-lg font-black text-slate-800">{log.totalMeters}m</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-50 pt-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Stitches</p>
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-lg font-black text-slate-800">{log.totalStitches.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div className={cn(
        "h-1.5 w-full",
        isDay ? "bg-amber-400" : "bg-slate-900"
      )} />
    </div>
  );
}

