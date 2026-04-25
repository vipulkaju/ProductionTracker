import React, { useState } from 'react';
import { ProductionItem, ProductionRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Calendar, Trash2, Plus, Pencil, History } from "lucide-react";
import { formatDate, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { AddProductionModal } from './AddProductionModal';

interface ProductionCardProps {
  item: ProductionItem;
  key?: React.Key;
  onDelete?: (id: string) => void;
  onEdit?: (item: ProductionItem) => void;
  onAddProduction?: (machineId: string, record: ProductionRecord) => void;
  onClick?: () => void;
}

export function ProductionCard({ item, onDelete, onEdit, onAddProduction, onClick }: ProductionCardProps) {
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ borderColor: "#6366f1", backgroundColor: "#fcfdff" }}
        onClick={() => setShowActions(!showActions)}
        className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer group h-full"
      >
        {/* Action Overlay */}
        <AnimatePresence>
          {showActions && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-20 bg-slate-900/60 flex items-center justify-center gap-2 p-2"
            >
              <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductionModalOpen(true);
                    setShowActions(false);
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick();
                    setShowActions(false);
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95"
                >
                  <History className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(item);
                    setShowActions(false);
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Pencil className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(item.id);
                    setShowActions(false);
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Trash2 className="w-5 h-5 text-rose-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-2 sm:px-5 sm:py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-[8px] sm:text-[10px] font-bold text-slate-400">{item.id}</span>
            <span className="font-bold text-slate-700 text-[9px] sm:text-xs uppercase tracking-tight truncate max-w-[50px] sm:max-w-none">{item.category}</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[10px]">
            <StatusBadge status={item.status} />
          </div>
        </div>
        
        <div className="p-3 sm:p-5 flex-1 flex flex-col space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">
                {item.machineHead ? "Head" : "Qty"}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-sm font-bold truncate">
                  {item.machineHead || item.quantity}
                </span>
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1 text-right">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">
                {item.machineArea ? "Area" : "Lead"}
              </p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[11px] sm:text-sm font-bold truncate">
                  {item.machineArea || (item.assignedTo && item.assignedTo.split(' ')[0])}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-slate-50">
            {item.frameMeters !== undefined && (
              <div className="flex justify-between items-center bg-slate-50 px-1.5 py-1 rounded-lg mb-1">
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase">Frame</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-600">{item.frameMeters}m</span>
              </div>
            )}
            <div className="flex justify-between items-end mb-0.5">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">Progress</p>
              <p className="text-[10px] sm:text-xs font-mono text-indigo-600 font-bold">{item.progress}%</p>
            </div>
            <ProgressBar progress={item.progress} status={item.status} />
          </div>
        </div>
      </motion.div>

      <AddProductionModal 
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        machineId={item.id}
        frameMeters={item.frameMeters}
        onAdd={(record) => onAddProduction?.(item.id, record)}
      />
    </>
  );
}
