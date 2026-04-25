import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Hash, Clock, FileText, Activity, Calendar } from 'lucide-react';
import { ProductionRecord } from '../types';
import { cn } from '../lib/utils';

interface EditProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (record: ProductionRecord) => void;
  record: ProductionRecord | null;
}

export function EditProductionModal({ isOpen, onClose, onUpdate, record }: EditProductionModalProps) {
  const [formData, setFormData] = useState<ProductionRecord | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onUpdate(formData);
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => {
      if (!prev) return null;
      return { ...prev, [name]: val };
    });
  };

  if (!formData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50 relative"
          >
            {/* Design Element */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />
            
            <div className="px-10 pt-12 pb-6 flex justify-between items-start border-b border-slate-50">
              <div>
                <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight leading-none uppercase italic">Edit Telemetry</h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className={cn(
                    "px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest",
                    formData.shift === 'DAY' ? "bg-amber-100 text-amber-700" : "bg-slate-900 text-white"
                  )}>
                    {formData.shift} Shift
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {formData.date}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 glass rounded-2xl hover:bg-slate-900 hover:text-white transition-all text-slate-400 active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormGroup label="Field operator" icon={User}>
                  <input 
                    name="operatorName" 
                    required 
                    value={formData.operatorName} 
                    onChange={handleChange} 
                    className="form-input-premium" 
                  />
                </FormGroup>

                <FormGroup label="Design Registry" icon={FileText}>
                  <input 
                    name="designName" 
                    required 
                    value={formData.designName} 
                    onChange={handleChange} 
                    className="form-input-premium" 
                  />
                </FormGroup>

                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <FormGroup label="Tich Count" icon={Activity}>
                    <input name="designStitch" type="number" required value={formData.designStitch} onChange={handleChange} className="form-input-premium bg-white" />
                  </FormGroup>

                  <FormGroup label="Frame Rotation" icon={Hash}>
                    <input name="frame" type="number" required value={formData.frame} onChange={handleChange} className="form-input-premium bg-white" />
                  </FormGroup>

                  <FormGroup label="Distance (m)" icon={Hash}>
                    <input name="totalMeters" type="number" step="0.01" required value={formData.totalMeters} onChange={handleChange} className="form-input-premium bg-white" />
                  </FormGroup>

                  <FormGroup label="Gross Production" icon={Activity}>
                    <input name="totalStitches" type="number" required value={formData.totalStitches} onChange={handleChange} className="form-input-premium bg-white font-black text-indigo-600" />
                  </FormGroup>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-sm font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                >
                  Apply System Update
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormGroup({ label, children, icon: Icon }: { label: string, children: React.ReactNode, icon: any }) {
  return (
    <div className="space-y-2 flex flex-col">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        {children}
      </div>
    </div>
  );
}
