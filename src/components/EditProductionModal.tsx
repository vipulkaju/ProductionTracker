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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4"
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
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Entry</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  {formData.shift} Shift — {formData.date}
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
                 <FormGroup label="Operator Name" icon={User}>
                  <input name="operatorName" required value={formData.operatorName} onChange={handleChange} className="form-input" />
                </FormGroup>

                <FormGroup label="Design Name" icon={FileText}>
                  <input name="designName" required value={formData.designName} onChange={handleChange} className="form-input" />
                </FormGroup>

                <FormGroup label="Tich" icon={Activity}>
                  <input name="designStitch" type="number" required value={formData.designStitch} onChange={handleChange} className="form-input" />
                </FormGroup>

                <FormGroup label="Frame" icon={Hash}>
                  <input name="frame" type="number" required value={formData.frame} onChange={handleChange} className="form-input" />
                </FormGroup>

                <FormGroup label="Meters" icon={Plus}>
                  <input name="totalMeters" type="number" step="0.01" required value={formData.totalMeters} onChange={handleChange} className="form-input" />
                </FormGroup>

                <FormGroup label="Total Stitch" icon={Activity}>
                  <input name="totalStitches" type="number" required value={formData.totalStitches} onChange={handleChange} className="form-input" />
                </FormGroup>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  Update Production Record
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
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
