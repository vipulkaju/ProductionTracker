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
            className="fixed inset-0 bg-[#f6efe9]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="soft-card w-full max-w-lg overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#ffafcc] via-[#bde0fe] to-[#bdfedb]" />
              
              <div className="px-6 sm:px-10 pt-8 sm:pt-12 pb-5 sm:pb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 font-display tracking-tight leading-none">Register Machine</h2>
                  <div className="text-[9px] sm:text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-3 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_10px_2px_rgba(52,211,153,0.3)]" />
                    Asset Onboarding Protocol
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 sm:p-4 pill-button rounded-[1.5rem] hover:text-rose-500 transition-all text-slate-400 active:scale-90"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-8 sm:pb-12 space-y-6 sm:space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                <div className="grid gap-6">
                  {/* Machine ID */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Machine ID</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-soft-sm group-focus-within:text-blue-500 transition-colors text-slate-300">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="e.g. MCH-901"
                        className="form-input-premium pl-16 uppercase"
                        value={formData.id || ''}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {/* Machine Head */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Heads</label>
                      <div className="relative group">
                        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-soft-sm group-focus-within:text-blue-500 transition-colors text-slate-300">
                          <Tag className="w-4 h-4" />
                        </div>
                        <input
                          required
                          type="number"
                          placeholder="0"
                          className="form-input-premium pl-14 sm:pl-16"
                          value={formData.machineHead || ''}
                          onChange={(e) => handleNumericChange('machineHead', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Machine Area */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Area(mm)</label>
                      <div className="relative group">
                        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-soft-sm group-focus-within:text-blue-500 transition-colors text-slate-300">
                          <Box className="w-4 h-4" />
                        </div>
                        <input
                          required
                          type="number"
                          placeholder="0"
                          className="form-input-premium pl-14 sm:pl-16"
                          value={formData.machineArea || ''}
                          onChange={(e) => handleNumericChange('machineArea', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frame Meters */}
                  <div className="p-6 sm:p-8 bg-white/50 border border-white soft-shadow-sm rounded-[2.5rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 sm:p-4 bg-white text-indigo-400 rounded-2xl shadow-soft">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-none">Net Calculation</p>
                        <p className="text-xs sm:text-sm font-black text-slate-800 mt-2 uppercase tracking-wide">1 Frame Meters</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-black text-blue-500 font-display tracking-tighter">{formData.frameMeters}</span>
                      <span className="text-[12px] font-black text-blue-300 ml-1 uppercase">M</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 w-full flex">
                  <button
                    type="submit"
                    className="w-full py-6 sm:py-8 pill-button-primary rounded-[3rem] text-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-soft-sm hover:shadow-soft"
                  >
                    <Plus className="w-6 h-6" />
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
