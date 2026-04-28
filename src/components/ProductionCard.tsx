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

        <div className="p-3 sm:p-6 flex flex-col h-full relative">
          
          <div className="flex flex-col gap-1 sm:gap-2 mb-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 max-w-full min-w-0">
                <div className={cn(
                  "w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-inner",
                  hasTodayEntry() ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                )} />
                <span className="font-display font-black text-slate-800 text-lg sm:text-3xl tracking-tighter leading-none break-all sm:break-normal">
                  {item.id}
                </span>
                
                {item.machineHead && (
                  <span className="ml-1 shrink-0 font-mono text-[10px] sm:text-sm font-black text-blue-600 bg-white shadow-soft-sm px-2 py-0.5 rounded-md uppercase tracking-widest border border-blue-50">
                    H{item.machineHead}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#ffafcc] shrink-0" />
              <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest break-words">{item.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
            <div className="bg-white/60 p-2.5 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] border border-white group-hover:bg-white transition-colors duration-500 min-w-0">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1.5 sm:mb-2 break-words whitespace-normal">
                {item.machineHead ? "Head" : "Qty"}
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 sm:w-1.5 h-4 sm:h-6 rounded-full bg-[#bde0fe] shrink-0" />
                <span className="text-base sm:text-2xl font-black text-slate-700 font-display break-words leading-none">
                  {item.machineHead || item.quantity}
                </span>
              </div>
            </div>
            
            <div className="bg-white/60 p-2.5 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] border border-white group-hover:bg-white transition-colors duration-500 min-w-0">
              <p className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1.5 sm:mb-2 break-words whitespace-normal">
                {item.machineArea ? "Area" : "Lead"}
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 sm:w-1.5 h-4 sm:h-6 rounded-full bg-[#ffafcc] shrink-0" />
                <span className="text-base sm:text-2xl font-black text-slate-700 font-display break-words leading-none">
                  {item.machineArea || (item.assignedTo && item.assignedTo.split(' ')[0])}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="bg-white p-2.5 sm:p-4 flex flex-col gap-2 rounded-[1rem] sm:rounded-[1.5rem] border border-slate-100/60 shadow-sm">
              <div className="flex justify-end sm:hidden mb-1">
                 <StatusBadge status={item.status} className="!px-2 !py-0.5 !text-[7px]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest break-words whitespace-normal">
                  Frame
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-700 break-words whitespace-normal">
                  {item.frameMeters || '0'}m
                </span>
              </div>
              <div className="hidden sm:flex justify-end mt-1">
                 <StatusBadge status={item.status} className="!px-3 !py-1 !text-[9px]" />
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
