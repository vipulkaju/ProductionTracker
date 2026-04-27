import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, User, Hash, Clock, FileText, Activity, Calendar } from 'lucide-react';
import { ProductionRecord } from '../types';
import { cn } from '../lib/utils';

interface AddProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: ProductionRecord) => void;
  machineId: string;
  frameMeters?: number;
}

export function AddProductionModal({ isOpen, onClose, onAdd, machineId, frameMeters }: AddProductionModalProps) {
  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [productionDate, setProductionDate] = useState(getYesterdayDate());
  const [currentShift, setCurrentShift] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftsData, setShiftsData] = useState<Record<'DAY' | 'NIGHT', {
    operatorName: string;
    designName: string;
    designStitch: number;
    frame: number;
    totalMeters: number;
    totalStitches: number;
  }>>({
    DAY: { operatorName: '', designName: '', designStitch: 0, frame: 0, totalMeters: 0, totalStitches: 0 },
    NIGHT: { operatorName: '', designName: '', designStitch: 0, frame: 0, totalMeters: 0, totalStitches: 0 },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save both shifts if they have data
    const shifts: ('DAY' | 'NIGHT')[] = ['DAY', 'NIGHT'];
    let recordsAdded = 0;

    shifts.forEach(shift => {
      const data = shiftsData[shift];
      // Only save if at least some data is entered (design name is a good indicator)
      if (data.designName.trim() || data.operatorName.trim()) {
        const newRecord: ProductionRecord = {
          id: `LOG-${Date.now().toString().slice(-6)}-${shift}`,
          machineId: machineId,
          date: productionDate,
          shift: shift,
          ...data
        };
        onAdd(newRecord);
        recordsAdded++;
      }
    });

    if (recordsAdded > 0) {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(value) || 0 : value;

    if (name === 'date') {
      setProductionDate(value);
    } else {
      setShiftsData(prev => {
        const currentData = { ...prev[currentShift], [name]: val };
        
        // Auto calculate totalMeters if frame or frameMeters is involved
        if (name === 'frame' && frameMeters) {
          currentData.totalMeters = Number(((val as number) * frameMeters).toFixed(2));
        }

        return {
          ...prev,
          [currentShift]: currentData
        };
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="soft-card w-full max-w-5xl overflow-hidden flex flex-col sm:flex-row max-h-[95vh] sm:max-h-[85vh] relative"
          >
            {/* Sidebar with Date & Shift selection */}
            <div className="w-full sm:w-80 bg-[#bde0fe] text-blue-900 p-6 sm:p-10 shrink-0 flex flex-col relative overflow-hidden border-b sm:border-b-0 sm:border-r border-white/40">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/30 rounded-full blur-2xl -ml-12 -mb-12" />

              <div className="relative z-10 space-y-8 flex flex-col h-full">
                <div className="flex justify-between items-start sm:block">
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-none italic uppercase">
                      Entry <span className="text-indigo-400">Node</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-2 sm:mt-4">
                      <div className="px-2 sm:px-3 py-1 bg-white/10 rounded-lg border border-white/10 font-black text-[9px] sm:text-[11px] uppercase tracking-widest text-indigo-300">
                        {machineId}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-700" />
                      <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden xs:block">Global Registry</div>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="sm:hidden p-3 bg-white/30 rounded-xl hover:bg-white/50 transition-all text-blue-600 active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 sm:space-y-8 flex-1 overflow-y-auto sm:overflow-visible pr-2 sm:pr-0 scrollbar-hide py-2">
                  <div className="p-4 sm:p-6 bg-white/30 rounded-3xl space-y-6">
                    <FormGroup label="Log Interval (Date)" icon={Calendar} isDark>
                      <input 
                        name="date" 
                        type="date" 
                        required 
                        value={productionDate || ''} 
                        onChange={handleChange} 
                        className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-[#f6efe9]/80 border border-white/50 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase text-blue-900 focus:border-white outline-none transition-all cursor-pointer shadow-soft-inset" 
                      />
                    </FormGroup>

                    <FormGroup label="Current Deployment (Shift)" icon={Clock} isDark>
                      <div className="flex sm:flex-col gap-3 pt-1">
                        <ShiftToggle 
                          active={currentShift === 'DAY'} 
                          onClick={() => setCurrentShift('DAY')}
                          icon={Clock}
                          label="Day"
                          color="amber"
                        />
                        <ShiftToggle 
                          active={currentShift === 'NIGHT'} 
                          onClick={() => setCurrentShift('NIGHT')}
                          icon={Clock}
                          label="Night"
                          color="indigo"
                        />
                      </div>
                    </FormGroup>
                  </div>
                </div>

                <div className="hidden sm:block pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <div className="w-4 h-[2px] bg-indigo-500/50" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Data Integrity Note</span>
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                    Verify all metrics against machine telemetry before committing to registry.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Form Content */}
            <div className={cn(
              "flex-1 p-6 sm:p-14 overflow-y-auto w-full scrollbar-hide relative pb-28 sm:pb-14 transition-all duration-700 bg-[#f6efe9]"
            )}>
              <button 
                onClick={onClose}
                className="hidden sm:flex absolute top-8 right-8 p-4 pill-button rounded-2xl hover:text-rose-500 transition-all text-slate-400 active:scale-90 group"
              >
                <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
              </button>
              
              <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
                <div className="space-y-8">
                  {/* Section: Identity */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <User className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Identity Profile</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormGroup label="Operator Name" icon={User}>
                        <input 
                          name="operatorName" 
                          required 
                          value={shiftsData[currentShift].operatorName || ''} 
                          onChange={handleChange} 
                          placeholder="ENTER OPERATOR NAME"
                          className="form-input-premium" 
                        />
                      </FormGroup>

                      <FormGroup label="Head" icon={FileText}>
                        <input 
                          name="designName" 
                          required 
                          value={shiftsData[currentShift].designName || ''} 
                          onChange={handleChange} 
                          placeholder="HEAD SERIAL ID"
                          className="form-input-premium" 
                        />
                      </FormGroup>
                    </div>
                  </div>

                  {/* Section: Metrics */}
                  <div className="space-y-6 pt-6 sm:pt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Production Metrics</h3>
                    </div>

                    <div className="soft-card p-6 sm:p-10 shadow-soft border border-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
                        <div className="space-y-6">
                          <FormGroup label="Design Stitches" icon={Activity}>
                            <input 
                              name="designStitch" 
                              type="number" 
                              required 
                              value={shiftsData[currentShift].designStitch ?? 0} 
                              onChange={handleChange} 
                              className="form-input-premium" 
                            />
                          </FormGroup>
                          <FormGroup label="Frame Iterations" icon={Hash}>
                            <input 
                              name="frame" 
                              type="number" 
                              required 
                              value={shiftsData[currentShift].frame ?? 0} 
                              onChange={handleChange} 
                              className="form-input-premium" 
                            />
                          </FormGroup>
                        </div>
                        
                        <div className="space-y-6">
                          <FormGroup label="Calculated Meters" icon={Plus}>
                            <input 
                              name="totalMeters" 
                              type="number" 
                              step="0.01" 
                              required 
                              value={shiftsData[currentShift].totalMeters ?? 0} 
                              onChange={handleChange} 
                              className="form-input-premium" 
                            />
                          </FormGroup>
                          <FormGroup label="Total Stitch Density" icon={Activity}>
                            <input 
                              name="totalStitches" 
                              type="number" 
                              required 
                              value={shiftsData[currentShift].totalStitches ?? 0} 
                              onChange={handleChange} 
                              className="form-input-premium !border-blue-200 !bg-blue-50/50 text-blue-600 focus:!border-blue-300 shadow-none" 
                            />
                          </FormGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 sm:pt-4">
                  <button
                    type="submit"
                    className="group relative w-full py-5 sm:py-7 pill-button-primary rounded-[2.5rem] sm:rounded-[3rem] text-[12px] sm:text-base font-black active:scale-[0.98] overflow-hidden border border-white/60"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-4 uppercase tracking-[0.4em]">
                      <span>Finalize Registry Commit</span>
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                  </button>
                  <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest sm:hidden">
                    Scroll down for all fields
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShiftToggle({ active, onClick, icon: Icon, label, color }: { active: boolean, onClick: () => void, icon: any, label: string, color: 'amber' | 'indigo' }) {
  const activeClasses = color === 'amber' ? "bg-white text-slate-800 shadow-soft border-white/50" : "bg-white text-slate-800 shadow-soft border-white/50";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center sm:justify-start gap-2 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all border border-transparent flex-1 sm:flex-none",
        active ? activeClasses : "bg-white/10 text-blue-900 border border-white/20 hover:bg-white/30 text-opacity-60"
      )}
    >
      <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl", active ? "bg-slate-100 text-slate-600" : "bg-white/20 text-blue-900")}>
        <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
      </div>
      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function FormGroup({ label, children, icon: Icon, isDark = false }: { label: string, children: React.ReactNode, icon: any, isDark?: boolean }) {
  return (
    <div className="space-y-2 flex flex-col">
      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-slate-500" : "text-slate-400")}>{label}</label>
      <div className="relative">
        <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-500" : "text-slate-300")}>
          <Icon className="w-full h-full" />
        </div>
        {children}
      </div>
    </div>
  );
}
