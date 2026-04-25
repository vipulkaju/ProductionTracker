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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={() => setShowActions(!showActions)}
        className="relative bg-white border border-slate-200 rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer group h-full hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300/50"
      >
        {/* Accents & Decorative Background */}
        <div className={cn(
          "h-32 sm:h-48 w-full absolute top-0 left-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.08] blur-3xl",
          item.status === 'COMPLETED' ? "bg-emerald-500" :
          item.status === 'DELAYED' ? "bg-rose-500" :
          item.status === 'QUALITY_CHECK' ? "bg-amber-500" : "bg-indigo-600"
        )} />
        
        <div className={cn(
          "h-2 w-full absolute top-0 left-0 z-10",
          item.status === 'COMPLETED' ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
          item.status === 'DELAYED' ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" :
          item.status === 'QUALITY_CHECK' ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : 
          "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        )} />

        {/* Action Overlay */}
        <AnimatePresence>
          {showActions && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-20 bg-slate-900/80 flex items-center justify-center p-4"
            >
              <div className="grid grid-cols-2 gap-3 w-full max-w-[220px]">
                <ActionButton 
                  icon={Plus} 
                  label="Add" 
                  color="indigo" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductionModalOpen(true);
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={History} 
                  label="History" 
                  color="amber" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick();
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={Pencil} 
                  label="Edit" 
                  color="blue" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(item);
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={Trash2} 
                  label="Delete" 
                  color="rose" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(item.id);
                    setShowActions(false);
                  }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-6 px-5 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="font-display font-black text-slate-900 text-lg sm:text-xl tracking-tight leading-none">
                {item.name}
              </span>
              <span className="font-mono text-[9px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">{item.id}</span>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50/80 rounded-3xl p-3 border border-slate-50">
              <p className="text-slate-400 text-[8px] uppercase font-black tracking-widest mb-1.5 leading-none">
                {item.machineHead ? "Total Heads" : "Quantity"}
              </p>
              <span className="text-sm font-black text-slate-800 font-display">
                {item.machineHead || item.quantity}
              </span>
            </div>
            <div className="bg-slate-50/80 rounded-3xl p-3 border border-slate-50">
              <p className="text-slate-400 text-[8px] uppercase font-black tracking-widest mb-1.5 leading-none">
                {item.machineArea ? "Area (mm)" : "Lead"}
              </p>
              <span className="text-sm font-black text-slate-800 font-display">
                {item.machineArea || (item.assignedTo && item.assignedTo.split(' ')[0])}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-50">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-slate-400 text-[9px] uppercase font-black tracking-widest">Efficiency</span>
              <span className="text-xs font-black text-indigo-600 font-mono">{item.progress}%</span>
            </div>
            <ProgressBar progress={item.progress} status={item.status} />
            
            {item.frameMeters !== undefined && (
              <div className="flex items-center gap-1.5 mt-4 text-emerald-600">
                <div className="w-5 h-5 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Frame Cap: {item.frameMeters}m</span>
              </div>
            )}
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

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: (e: any) => void }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 hover:text-indigo-300",
    amber: "text-amber-400 hover:text-amber-300",
    blue: "text-blue-400 hover:text-blue-300",
    rose: "text-rose-400 hover:text-rose-300"
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95 group/btn"
    >
      <Icon className={cn("w-6 h-6 transition-transform group-hover/btn:scale-110", colors[color])} />
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
