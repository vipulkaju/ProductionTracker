import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Package, User, Hash, Tag, Box } from 'lucide-react';
import { ProductionItem, ProductionStatus } from '../types';
import { cn } from '../lib/utils';

interface AddMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: ProductionItem) => void;
}

export function AddMachineModal({ isOpen, onClose, onAdd }: AddMachineModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    machineHead: 0,
    machineArea: 0,
    frameMeters: 0,
  });

  const handleNumericChange = (field: 'machineHead' | 'machineArea', value: string) => {
    const numValue = parseFloat(value) || 0;
    const nextData = { ...formData, [field]: numValue };
    nextData.frameMeters = Number(((nextData.machineHead * nextData.machineArea) / 1000).toFixed(4));
    setFormData(nextData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ProductionItem = {
      id: formData.id || `MCH-${Date.now().toString().slice(-6)}`,
      name: `Machine ${formData.id || Date.now().toString().slice(-4)}`,
      machineHead: formData.machineHead.toString(),
      machineArea: formData.machineArea.toString(),
      frameMeters: formData.frameMeters,
      category: `Area ${formData.machineArea}`, // Mapping area to category
      quantity: 0,
      status: 'QUEUED',
      priority: 'MEDIUM', // Default priority
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      assignedTo: 'Unassigned', // Default lead
    };
    onAdd(newItem);
    setFormData({ id: '', machineHead: 0, machineArea: 0, frameMeters: 0 });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
              
              <div className="px-5 sm:px-10 pt-8 sm:pt-12 pb-5 sm:pb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight leading-none">Register Machine</h2>
                  <div className="text-[9px] sm:text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-2 sm:mt-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Asset Onboarding Protocol
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 sm:p-3 glass rounded-xl sm:rounded-2xl hover:bg-slate-900 hover:text-white transition-all text-slate-400 active:scale-90"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 sm:px-10 pb-8 sm:pb-12 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="grid gap-6">
                  {/* Machine ID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Machine ID</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="e.g. MCH-901"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 group-hover:border-slate-200"
                        value={formData.id || ''}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Machine Head */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Heads</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">
                          <Tag className="w-4 h-4" />
                        </div>
                        <input
                          required
                          type="number"
                          placeholder="0"
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                          value={formData.machineHead || ''}
                          onChange={(e) => handleNumericChange('machineHead', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Machine Area */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Area (mm)</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">
                          <Box className="w-4 h-4" />
                        </div>
                        <input
                          required
                          type="number"
                          placeholder="0"
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                          value={formData.machineArea || ''}
                          onChange={(e) => handleNumericChange('machineArea', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frame Meters */}
                  <div className="p-6 bg-indigo-50 border border-indigo-100/50 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white text-indigo-600 rounded-2xl shadow-sm">
                        <Plus className="w-5 h-5 rotate-45" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Net Calculation</p>
                        <p className="text-xs font-black text-indigo-900 mt-1 uppercase">1 Frame Meters</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-600 font-display tracking-tight">{formData.frameMeters}</span>
                      <span className="text-[10px] font-black text-indigo-400 ml-1 uppercase">M</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-slate-900 hover:shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    Complete Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
