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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Machine Config</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  ID: {formData.id}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Machine Name" icon={Settings}>
                  <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                </FormGroup>

                <FormGroup label="Category" icon={LayoutGrid}>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all">
                    <option value="Machine">Machine</option>
                    <option value="Job Work">Job Work</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </FormGroup>

                <FormGroup label="Machine Head" icon={Settings}>
                  <input name="machineHead" type="number" required value={formData.machineHead} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                </FormGroup>

                <FormGroup label="Machine Area" icon={LayoutGrid}>
                  <input name="machineArea" type="number" required value={formData.machineArea} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                </FormGroup>

                <FormGroup label="Frame Meters (Auto)" icon={Ruler}>
                  <input name="frameMeters" type="number" step="0.0001" readOnly value={formData.frameMeters} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none cursor-default" />
                </FormGroup>

                <FormGroup label="Status" icon={Layers}>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all">
                    <option value="IN_PROGRESS">Running</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="QUALITY_CHECK">Quality Check</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </FormGroup>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  Update Machine Info
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
    <div className="space-y-1.5 flex flex-col">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {children}
      </div>
    </div>
  );
}
