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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Register Machine</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Device Onboarding</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-4">
                  {/* Machine ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Machine ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. MCH-901"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        value={formData.id || ''}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Machine Head */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Machine Head</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="number"
                        placeholder="Enter value"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        value={formData.machineHead || ''}
                        onChange={(e) => handleNumericChange('machineHead', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Machine Area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Machine Area</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="number"
                        placeholder="Enter value"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        value={formData.machineArea || ''}
                        onChange={(e) => handleNumericChange('machineArea', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Frame Meters */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1 Frame Meters (Auto)</label>
                    <div className="relative">
                      <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-45" />
                      <input
                        readOnly
                        type="number"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none cursor-default"
                        value={formData.frameMeters}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Register Machine
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
