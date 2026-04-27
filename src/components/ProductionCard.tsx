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

  const hasTodayEntry = () => {
    if (!item.productionLogs || item.productionLogs.length === 0) return false;
    const tzDay = new Date();
    const todayStr = tzDay.getFullYear() + '-' + String(tzDay.getMonth() + 1).padStart(2, '0') + '-' + String(tzDay.getDate()).padStart(2, '0');
    return item.productionLogs.some(log => log.date === todayStr);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
        onClick={() => setShowActions(!showActions)}
        className="bento-card relative flex flex-col transition-all cursor-pointer group h-auto min-h-[400px] hover:shimmer"
      >
        {/* Accents & Decorative Background */}
        <div className={cn(
          "h-full w-full absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-40 blur-[60px] -z-10",
          item.status === 'COMPLETED' ? "bg-[#bdfedb]" :
          item.status === 'DELAYED' ? "bg-[#ffafcc]" :
          item.status === 'QUALITY_CHECK' ? "bg-[#fbefcc]" : "bg-[#bde0fe]"
        )} />
        
        <div className={cn(
          "h-2 w-full absolute top-0 left-0 z-10 transition-all duration-500 rounded-t-[3.5rem]",
          item.status === 'COMPLETED' ? "bg-[#bdfedb]" :
          item.status === 'DELAYED' ? "bg-[#ffafcc]" :
          item.status === 'QUALITY_CHECK' ? "bg-[#fbefcc]" : "bg-[#bde0fe]"
        )} />

        {/* Action Overlay */}
        <AnimatePresence>
          {showActions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-[#f6efe9]/90 backdrop-blur-md flex items-center justify-center p-6 rounded-[3.5rem] border border-white/60 shadow-soft"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-[280px]">
                <ActionButton 
                  icon={Plus} 
                  label="Add Entry" 
                  color="indigo" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductionModalOpen(true);
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={Pencil} 
                  label="Edit Asset" 
                  color="blue" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(item);
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={History} 
                  label="Telemetry" 
                  color="amber" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick();
                    setShowActions(false);
                  }} 
                />
                <ActionButton 
                  icon={Trash2} 
                  label="Purge" 
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

        <div className="pt-6 sm:pt-10 px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-6 sm:mb-8 gap-4">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-inner shrink-0",
                  hasTodayEntry() ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]"
                )} />
                <span className="font-display font-black text-slate-800 text-3xl sm:text-5xl tracking-tighter leading-none truncate">
                  {item.id}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffafcc] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">{item.name}</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-3">
              <StatusBadge status={item.status} className="!px-3 sm:!px-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            <div className="soft-card p-3 sm:p-6 border border-white/60 group-hover:bg-white transition-colors duration-500 rounded-[2rem] sm:rounded-[2.5rem] min-w-0">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.25em] sm:tracking-[0.3em] mb-2 sm:mb-4 leading-none truncate">
                {item.machineHead ? "Capacity" : "Quantity"}
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-2 sm:w-3 h-8 sm:h-12 rounded-full bg-[#bde0fe] shrink-0" />
                <span className="text-xl sm:text-3xl font-black text-slate-700 font-display truncate">
                  {item.machineHead || item.quantity}
                </span>
              </div>
            </div>
            <div className="soft-card p-3 sm:p-6 border border-white/60 group-hover:bg-white transition-colors duration-500 rounded-[2rem] sm:rounded-[2.5rem] min-w-0">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.25em] sm:tracking-[0.3em] mb-2 sm:mb-4 leading-none truncate">
                {item.machineArea ? "Area" : "Lead"}
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-2 sm:w-3 h-8 sm:h-12 rounded-full bg-[#ffafcc] shrink-0" />
                <span className="text-xl sm:text-3xl font-black text-slate-700 font-display truncate">
                  {item.machineArea || (item.assignedTo && item.assignedTo.split(' ')[0])}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 sm:space-y-6">
            <div className="flex items-center justify-between px-1 sm:px-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 soft-card flex items-center justify-center text-blue-400 border border-white">
                  <History className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[8px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-widest truncate">Frame Dist.</span>
              </div>
              <span className="text-[10px] sm:text-[16px] font-black font-mono text-slate-700 bg-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-full sm:rounded-[1.5rem] shadow-soft-sm border border-white/60 truncate shrink-0 max-w-[50%] text-right">{item.frameMeters || '0.000'}m</span>
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

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: (e: any) => void }) {
  const colors: Record<string, string> = {
    indigo: "text-[#bde0fe] bg-[#bde0fe]/10 border-[#bde0fe]/30",
    amber: "text-amber-500 bg-amber-50 border-amber-200/50",
    blue: "text-blue-500 bg-blue-50 border-blue-200/50",
    rose: "text-[#ffafcc] bg-[#ffafcc]/10 border-[#ffafcc]/30"
  };

  return (
    <button 
      onClick={onClick}
      className={cn("pill-button rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-6 flex flex-col items-center justify-center gap-1.5 sm:gap-3 active:scale-95 group/btn overflow-hidden", colors[color])}
    >
      <Icon className="w-5 h-5 sm:w-8 sm:h-8 transition-transform group-hover/btn:scale-110 shrink-0" />
      <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate w-full text-center">{label}</span>
    </button>
  );
}
