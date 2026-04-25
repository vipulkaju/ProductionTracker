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
            className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/50 flex flex-col sm:flex-row max-h-[95vh] sm:max-h-[90vh]"
          >
            {/* Sidebar with Date & Shift selection */}
            <div className="w-full sm:w-80 bg-slate-900 text-white p-5 sm:p-8 space-y-5 sm:space-y-10 shrink-0 flex flex-col">
              <div className="flex justify-between items-start sm:block">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight leading-none">Recording</h2>
                  <div className="flex items-center gap-2 mt-2 sm:mt-4">
                    <div className="p-1 px-2 sm:px-3 bg-indigo-600 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-widest">{machineId}</div>
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden xs:block">Telemetry Node</div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="sm:hidden p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white/50 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 sm:space-y-8 flex-1 overflow-y-auto sm:overflow-visible pr-2 sm:pr-0 scrollbar-hide">
                <FormGroup label="Log Date" icon={Calendar} isDark>
                  <input 
                    name="date" 
                    type="date" 
                    required 
                    value={productionDate || ''} 
                    onChange={handleChange} 
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white/10 border-2 border-white/10 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase text-white focus:border-indigo-500 outline-none transition-all cursor-pointer" 
                  />
                </FormGroup>

                <FormGroup label="Select Shift" icon={Clock} isDark>
                  <div className="flex sm:flex-col gap-3 pt-2">
                    <ShiftToggle 
                      active={currentShift === 'DAY'} 
                      onClick={() => setCurrentShift('DAY')}
                      icon={Clock}
                      label="Day Shift"
                      color="amber"
                    />
                    <ShiftToggle 
                      active={currentShift === 'NIGHT'} 
                      onClick={() => setCurrentShift('NIGHT')}
                      icon={Clock}
                      label="Night Shift"
                      color="indigo"
                    />
                  </div>
                </FormGroup>
              </div>

              <div className="hidden sm:flex pt-10 flex-1 items-end">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                  Enter production data for each shift. Records will be committed atomically.
                </p>
              </div>
            </div>

            {/* Main Form Content */}
            <div className={cn(
              "flex-1 p-5 sm:p-12 overflow-y-auto w-full scrollbar-hide relative pb-24 sm:pb-12 transition-colors duration-500",
              currentShift === 'DAY' ? 'bg-white' : 'bg-indigo-50/50'
            )}>
              <button 
                onClick={onClose}
                className={cn(
                  "hidden sm:block absolute top-6 right-6 p-3 rounded-2xl transition-all active:scale-90",
                  currentShift === 'DAY' ? 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900' : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 shadow-sm'
                )}
              >
                <X className="w-5 h-5" />
              </button>
              
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10 mt-2 sm:mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
                  <FormGroup label="Operator Identity" icon={User}>
                    <input 
                      name="operatorName" 
                      required 
                      value={shiftsData[currentShift].operatorName || ''} 
                      onChange={handleChange} 
                      placeholder="ENTER NAME"
                      className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl" 
                    />
                  </FormGroup>

                  <FormGroup label="Design Specification" icon={FileText}>
                    <input 
                      name="designName" 
                      required 
                      value={shiftsData[currentShift].designName || ''} 
                      onChange={handleChange} 
                      placeholder="DESIGN ID"
                      className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl" 
                    />
                  </FormGroup>

                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-50">
                    <FormGroup label="Stat St" icon={Activity}>
                      <input 
                        name="designStitch" 
                        type="number" 
                        required 
                        value={shiftsData[currentShift].designStitch ?? 0} 
                        onChange={handleChange} 
                        className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl" 
                      />
                    </FormGroup>
                    <FormGroup label="Frame Count" icon={Hash}>
                      <input 
                        name="frame" 
                        type="number" 
                        required 
                        value={shiftsData[currentShift].frame ?? 0} 
                        onChange={handleChange} 
                        className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl" 
                      />
                    </FormGroup>
                    <FormGroup label="Net Meters" icon={Plus}>
                      <input 
                        name="totalMeters" 
                        type="number" 
                        step="0.01" 
                        required 
                        value={shiftsData[currentShift].totalMeters ?? 0} 
                        onChange={handleChange} 
                        className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl" 
                      />
                    </FormGroup>
                    <FormGroup label="Total Tich" icon={Activity}>
                      <input 
                        name="totalStitches" 
                        type="number" 
                        required 
                        value={shiftsData[currentShift].totalStitches ?? 0} 
                        onChange={handleChange} 
                        className="form-input-premium sm:form-input-premium !py-3 sm:!py-4 !pl-10 sm:!pl-12 !rounded-xl sm:!rounded-2xl font-black text-indigo-600" 
                      />
                    </FormGroup>
                  </div>
                </div>

                <div className="pt-6 sm:pt-10">
                  <button
                    type="submit"
                    className="group relative w-full py-4 sm:py-6 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] text-[12px] sm:text-sm font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-[0.98] overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                      Save Global Shift Records
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
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
  const activeClasses = color === 'amber' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center sm:justify-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all border-2 flex-1 sm:flex-none",
        active ? activeClasses + " border-transparent" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
      )}
    >
      <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl", active ? "bg-white/20" : "bg-white/5")}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{label}</span>
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
