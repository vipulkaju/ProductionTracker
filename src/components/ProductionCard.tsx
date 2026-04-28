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
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={() => setShowActions(!showActions)}
        className="bento-card relative flex flex-col transition-all cursor-pointer group h-full shadow-soft sm:min-h-[320px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden"
      >
        {/* Accents & Decorative Background */}
        <div className={cn(
          "h-full w-full absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-40 blur-[40px] -z-10",
          item.status === 'COMPLETED' ? "bg-[#bdfedb]" :
          item.status === 'DELAYED' ? "bg-[#ffafcc]" :
          item.status === 'QUALITY_CHECK' ? "bg-[#fbefcc]" : "bg-[#bde0fe]"
        )} />
        
        <div className={cn(
          "h-1.5 sm:h-2 w-full absolute top-0 left-0 z-10 transition-all duration-500 rounded-t-[1.5rem] sm:rounded-t-[2rem]",
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
              className="absolute inset-0 z-30 bg-[#f6efe9]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 shadow-soft"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full h-full max-h-[300px]">
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

        <div className="p-3 sm:p-5 flex flex-col h-full relative">
          
          <div className="flex justify-between items-start mb-3 sm:mb-4 pr-1">
            <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 max-w-full min-w-0">
                <div className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-inner",
                  hasTodayEntry() ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                )} />
                <span className="font-display font-black text-slate-800 text-xl sm:text-3xl tracking-tighter leading-none truncate">
                  {item.id}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 ml-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffafcc] shrink-0" />
                <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">{item.name}</span>
              </div>
            </div>

            {item.machineHead && (
              <div className="flex flex-col items-end shrink-0 ml-2 pt-1">
                <span className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-blue-400 mb-0.5">Head</span>
                <div className="bg-white shadow-soft-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-blue-50">
                  <span className="font-mono font-black text-lg sm:text-2xl text-blue-600 leading-none">
                    {item.machineHead}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 shrink-0">
            <div className="bg-white/70 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center border border-white group-hover:bg-white transition-colors duration-500 shadow-sm relative overflow-hidden h-20 sm:h-24">
               <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1 truncate">
                {item.machineHead ? "Head" : "Qty"}
              </p>
               <span className="text-2xl sm:text-4xl font-black text-slate-700 font-display truncate leading-none">
                 {item.machineHead || item.quantity}
               </span>
            </div>
            
            <div className="bg-white/70 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center border border-white group-hover:bg-white transition-colors duration-500 shadow-sm relative overflow-hidden h-20 sm:h-24">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1 truncate">
                {item.machineArea ? "Area" : "Lead"}
              </p>
               <span className="text-2xl sm:text-4xl font-black text-slate-700 font-display truncate leading-none">
                 {item.machineArea || (item.assignedTo && item.assignedTo.split(' ')[0])}
               </span>
            </div>
          </div>

          <div className="mt-auto">
            <div className="bg-white px-3 py-2 sm:px-4 sm:py-3 flex flex-col justify-center rounded-2xl border border-slate-100/60 shadow-sm relative min-h-[48px]">
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                <StatusBadge status={item.status} className="!px-2.5 !py-1 !text-[7px] sm:!text-[9px]" />
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">
                  Frame
                </span>
                <span className="text-sm sm:text-lg font-black font-mono text-slate-700 truncate leading-none">
                  {item.frameMeters || '0'}
                  <span className="text-[9px] sm:text-xs text-slate-400 ml-0.5">m</span>
                </span>
              </div>
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
      <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] break-words whitespace-normal w-full text-center leading-tight">{label}</span>
    </button>
  );
}
