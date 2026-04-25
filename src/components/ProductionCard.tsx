import React, { useState } from 'react';
import { ProductionItem, ProductionRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Calendar, Trash2, Plus } from "lucide-react";
import { formatDate, cn } from "../lib/utils";
import { motion } from "motion/react";
import { AddProductionModal } from './AddProductionModal';

interface ProductionCardProps {
  item: ProductionItem;
  key?: React.Key;
  onDelete?: (id: string) => void;
  onAddProduction?: (machineId: string, record: ProductionRecord) => void;
  onClick?: () => void;
}

export function ProductionCard({ item, onDelete, onAddProduction, onClick }: ProductionCardProps) {
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
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer group"
      >
        <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-slate-400">{item.id}</span>
            <span className="font-bold text-slate-700 text-xs uppercase tracking-tight">{item.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={item.status} />
            <div className="flex items-center gap-1 border-l border-slate-200 ml-1 pl-1">
              {onAddProduction && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductionModalOpen(true);
                  }}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                  title="Add Production"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Delete Machine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-bold text-slate-800 leading-snug">{item.name}</h3>
            <div className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
              item.priority === 'HIGH' ? "bg-rose-100 text-rose-700" :
              item.priority === 'MEDIUM' ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-slate-700"
            )}>
              {item.priority}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {item.machineHead ? "Machine Head" : "Yield/Quantity"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold truncate">
                  {item.machineHead || item.quantity}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {item.machineArea ? "Machine Area" : "Lead"}
              </p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-bold truncate max-w-[100px]">
                  {item.machineArea || item.assignedTo.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            {item.frameMeters !== undefined && (
              <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Frame Meters</span>
                <span className="text-xs font-mono font-bold text-indigo-600">{item.frameMeters}m</span>
              </div>
            )}
            <div className="flex justify-between items-end mb-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Production Flow</p>
              <p className="text-xs font-mono text-indigo-600 font-bold">{item.progress}%</p>
            </div>
            <ProgressBar progress={item.progress} status={item.status} />
            <div className="flex items-center gap-1.5 text-slate-500 mt-1">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Due {formatDate(item.dueDate)}</span>
            </div>
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
