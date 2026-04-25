import React, { useState } from 'react';
import { ProductionItem, ProductionRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Calendar, Trash2, Plus, Pencil } from "lucide-react";
import { formatDate, cn } from "../lib/utils";
import { motion } from "motion/react";
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

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ borderColor: "#6366f1", backgroundColor: "#fcfdff" }}
        onClick={onClick}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer group h-full"
      >
        <div className="p-2 sm:px-5 sm:py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-[8px] sm:text-[10px] font-bold text-slate-400">{item.id}</span>
            <span className="font-bold text-slate-700 text-[9px] sm:text-xs uppercase tracking-tight truncate max-w-[50px] sm:max-w-none">{item.category}</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[10px]">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {onEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-1 sm:p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                  title="Edit Machine"
                >
                  <Pencil className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              )}
              {onAddProduction && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductionModalOpen(true);
                  }}
                  className="p-1 sm:p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                  title="Add Production"
                >
                  <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1 sm:p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Delete Machine"
                >
                  <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              )}
            </div>
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
