import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, LayoutGrid, Ruler, Layers } from 'lucide-react';
import { ProductionItem, ProductionStatus } from '../types';
import { cn } from '../lib/utils';

interface EditMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (item: ProductionItem) => void;
  item: ProductionItem | null;
}

export function EditMachineModal({ isOpen, onClose, onUpdate, item }: EditMachineModalProps) {
  const [formData, setFormData] = useState<ProductionItem | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

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
      const next = { ...prev, [name]: val };
      
      // Auto-calculate frame meters if head or area changes
      if (name === 'machineHead' || name === 'machineArea') {
        const head = name === 'machineHead' ? parseFloat(value) || 0 : parseFloat(prev.machineHead || '0') || 0;
        const area = name === 'machineArea' ? parseFloat(value) || 0 : parseFloat(prev.machineArea || '0') || 0;
        next.frameMeters = Number(((head * area) / 1000).toFixed(4));
      }
      
      return next;
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-6"
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
                <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight leading-none uppercase italic">Modify Asset</h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest">
                    ID: {formData.id}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Configuration Node
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
                <FormGroup label="Asset Label" icon={Settings}>
                  <input name="name" required value={formData.name} onChange={handleChange} className="form-input-premium" />
                </FormGroup>

                <FormGroup label="Asset Class" icon={LayoutGrid}>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-input-premium appearance-none">
                    <option value="Machine">Machine</option>
                    <option value="Job Work">Job Work</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </FormGroup>

                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <FormGroup label="Metric: Head" icon={Settings}>
                    <input name="machineHead" type="number" required value={formData.machineHead} onChange={handleChange} className="form-input-premium bg-white" />
                  </FormGroup>

                  <FormGroup label="Metric: Area" icon={LayoutGrid}>
                    <input name="machineArea" type="number" required value={formData.machineArea} onChange={handleChange} className="form-input-premium bg-white" />
                  </FormGroup>

                  <FormGroup label="Calculated m/f" icon={Ruler}>
                    <input name="frameMeters" type="number" step="0.0001" readOnly value={formData.frameMeters} className="form-input-premium bg-white/50 font-black text-indigo-600 border-dashed cursor-default" />
                  </FormGroup>

                  <FormGroup label="Operational Status" icon={Layers}>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-input-premium bg-white appearance-none">
                      <option value="IN_PROGRESS">Running</option>
                      <option value="DELAYED">Delayed</option>
                      <option value="QUALITY_CHECK">Quality Check</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </FormGroup>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-sm font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                >
                  Commit Asset Change
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
