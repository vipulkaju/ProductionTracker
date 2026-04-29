import React, { useMemo, useEffect, useState } from 'react';
import { ProductionItem, ProductionRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Box,
  Calendar, 
  User, 
  FileText, 
  Activity, 
  Hash, 
  Plus,
  Clock,
  LayoutDashboard,
  Layers,
  Ruler,
  Trash2,
  Pencil,
  Sun,
  Moon
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { useFirebase } from '../context/FirebaseContext';
import { collection, query, orderBy, onSnapshot, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { EditProductionModal } from './EditProductionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { AddProductionModal } from './AddProductionModal';
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';

interface MachineDetailProps {
  item: ProductionItem;
  onBack: () => void;
  onAddProduction: (machineId: string, record: ProductionRecord) => void;
  onDeleteMachine: (id: string) => void;
  key?: React.Key;
}

export function MachineDetail({ item, onBack, onAddProduction, onDeleteMachine }: MachineDetailProps) {
  const { user } = useFirebase();
  const [logs, setLogs] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState<ProductionRecord | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const logsRef = collection(db, 'machines', item.id, 'logs');
    const q = query(
      logsRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: ProductionRecord[] = [];
      snapshot.forEach(doc => {
        fetchedLogs.push({ ...doc.data() as ProductionRecord, id: doc.id });
      });
      setLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `machines/${item.id}/logs`);
    });

    return unsubscribe;
  }, [item.id, user]);

  const handleDeleteLog = async () => {
    if (!user || !logToDelete) return;
    const path = `machines/${item.id}/logs/${logToDelete}`;
    try {
      await deleteDoc(doc(db, 'machines', item.id, 'logs', logToDelete));
      setLogToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUpdateLog = async (updatedRecord: ProductionRecord) => {
    if (!user || !updatedRecord.id) return;
    const path = `machines/${item.id}/logs/${updatedRecord.id}`;
    try {
      const logRef = doc(db, 'machines', item.id, 'logs', updatedRecord.id);
      await updateDoc(logRef, {
        ...updatedRecord,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const logsByDate = useMemo(() => {
    const groups: Record<string, { DAY?: ProductionRecord; NIGHT?: ProductionRecord }> = {};
    logs.forEach(log => {
      if (!groups[log.date]) {
        groups[log.date] = {};
      }
      groups[log.date][log.shift] = log;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);


  const monthlyUptimeData = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start, end });

    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(log => log.date === dateStr);
      
      let status: 'NONE' | 'PARTIAL' | 'FULL' = 'NONE';
      if (dayLogs.length === 1) status = 'PARTIAL';
      if (dayLogs.length >= 2) status = 'FULL';

      return {
        date: day,
        dateStr,
        status,
        dayNum: format(day, 'd')
      };
    });
  }, [logs]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-10 pb-12"
    >
      {/* Deep Cinematic Header Project Node */}
      <div className="bento-card p-6 sm:p-10 relative overflow-hidden group w-full flex flex-col justify-center min-h-[300px]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full group-hover:bg-indigo-600/10 transition-colors duration-1000 translate-x-1/3 -translate-y-1/3" />
        
        {/* Middle Main Row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-14 relative z-10 w-full py-2">
          <h2 className="text-6xl sm:text-8xl font-black text-slate-800 font-display tracking-tighter leading-tight uppercase italic drop-shadow-sm shrink-0">
            {item.id}
          </h2>

          {item.machineHead && (
            <span className="text-5xl sm:text-7xl font-black text-indigo-500 font-display uppercase italic tracking-tighter drop-shadow-sm leading-none shrink-0">
              HEAD {item.machineHead}
            </span>
          )}
        </div>
      </div>


      {/* Monthly Uptime Heatmap */}
      <section className="space-y-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-200">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none italic">Temporal Mapping</h3>
              <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1.5">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-4 sm:gap-6 bg-white p-4 rounded-3xl border border-slate-100 px-6 sm:px-8 shadow-sm">
              <LegendItem color="bg-rose-500" label="Zero" />
              <LegendItem color="bg-amber-500" label="Partial" />
              <LegendItem color="bg-emerald-500" label="Saturated" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex flex-1 items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:bg-indigo-700 justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
              <button
                onClick={() => onDeleteMachine(item.id)}
                className="flex items-center justify-center p-4 bg-rose-50 text-rose-600 rounded-3xl transition-transform active:scale-95 hover:bg-rose-100 shrink-0"
                title="Delete Machine"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bento-card p-10">
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-31 gap-4">
            {monthlyUptimeData.map((day) => (
              <motion.div 
                key={day.dateStr}
                whileHover={{ y: -6, scale: 1.15 }}
                className={cn(
                  "aspect-square rounded-2xl flex items-center justify-center transition-all shadow-sm relative group",
                  day.status === 'NONE' ? "bg-slate-50 text-slate-300 border-2 border-slate-100" :
                  day.status === 'PARTIAL' ? "bg-amber-50 text-amber-600 border-2 border-amber-200 shadow-amber-100" :
                  "bg-emerald-50 text-emerald-600 border-2 border-emerald-200 shadow-emerald-100"
                )}
              >
                <span className="text-[11px] font-black">{day.dayNum}</span>
                {day.status !== 'NONE' && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                    day.status === 'PARTIAL' ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Production History Section */}
      <section className="space-y-12">
        <div className="flex items-center gap-6 px-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-100">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 flex flex-col">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter translate-y-1 italic">Registry Archives</h3>
            <div className="h-px bg-slate-100 mt-3 w-full" />
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Deciphering Nexus History...</p>
          </div>
        ) : logsByDate.length > 0 ? (
          <div className="space-y-24">
            {logsByDate.map(([date, shifts]) => (
              <div key={date} className="space-y-10 relative">
                <div className="flex items-center gap-8 sticky top-32 z-10 py-4 bg-slate-50/50 backdrop-blur-md -mx-4 px-4">
                  <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <span className="text-[13px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                      {formatDate(date)}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-10">
                  <ShiftSideCard 
                    shift="DAY" 
                    log={shifts.DAY} 
                    title="DAY SHIFT"
                    accentColor="amber"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
                    comparison={shifts.DAY && shifts.NIGHT ? (shifts.DAY.totalStitches >= shifts.NIGHT.totalStitches ? 'higher' : 'lower') : undefined}
                  />
                  <ShiftSideCard 
                    shift="NIGHT" 
                    log={shifts.NIGHT} 
                    title="NIGHT SHIFT"
                    accentColor="slate"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
                    comparison={shifts.DAY && shifts.NIGHT ? (shifts.NIGHT.totalStitches >= shifts.DAY.totalStitches ? 'higher' : 'lower') : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 bento-card border-dashed border-4 border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-10">
              <Activity className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 font-display uppercase tracking-tighter">ARCHIVE EMPTY</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-4 max-w-sm">No telemetry records detected for this node in the registry.</p>
          </div>
        )}
      </section>

      <EditProductionModal 
        isOpen={!!editLog} 
        onClose={() => setEditLog(null)} 
        record={editLog} 
        onUpdate={handleUpdateLog} 
      />

      <ConfirmationModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={handleDeleteLog}
        title="Destroy Record?"
        message="Attention: This operation is destructive and irreversible. Confirm log removal?"
        confirmText="Confirm Delete"
        variant="danger"
      />

      <AddProductionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        machineId={item.id}
        frameMeters={item.frameMeters}
        onAdd={(record) => onAddProduction(item.id, record)}
      />

    </motion.div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full shadow-sm", color)} />
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

interface ShiftSideCardProps {
  shift: 'DAY' | 'NIGHT';
  log: ProductionRecord | undefined;
  title: string;
  accentColor: string;
  onDelete: (id: string) => void;
  onEdit: (record: ProductionRecord) => void;
}

function ShiftSideCard({ shift, log, title, accentColor, onDelete, onEdit, comparison }: ShiftSideCardProps & { comparison?: 'higher' | 'lower' }) {
  const [showActions, setShowActions] = useState(false);

  if (!log) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center group transition-all opacity-40 grayscale min-h-[220px]">
        <Clock className="w-10 h-10 text-slate-300 mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-[9px] font-black text-slate-300 mt-2 uppercase tracking-[0.3em]">No Telemetry</p>
      </div>
    );
  }

  const isDay = shift === 'DAY';
  const isWinner = comparison === 'higher';
  const isLoser = comparison === 'lower';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
      onClick={() => setShowActions(!showActions)}
      className={cn(
        "relative bento-card border-2 flex flex-col cursor-pointer group hover:shimmer",
        isWinner ? "border-emerald-200 shadow-emerald-200/50" : 
        isLoser ? "border-rose-200 shadow-rose-200/50" :
        isDay ? "border-amber-100 shadow-amber-100/50" : "border-slate-200 shadow-slate-200/50"
      )}
    >
      {/* Action Overlay */}
      <AnimatePresence>
        {(showActions) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 gap-8 shrink-0"
          >
            <ActionButton 
              icon={Pencil} 
              label="Sync Edit" 
              color="indigo" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
                setShowActions(false);
              }} 
            />
            <ActionButton 
              icon={Trash2} 
              label="Purge Log" 
              color="rose" 
              onClick={(e) => {
                e.stopPropagation();
                if (log.id) onDelete(log.id);
                setShowActions(false);
              }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Accent */}
      <div className={cn(
        "px-3 py-4 sm:px-6 sm:py-6 flex flex-col justify-between relative overflow-hidden h-full gap-3 sm:gap-6",
        isWinner ? "bg-[#bdfedb]/30" : 
        isLoser ? "bg-[#fedbdc]/30" :
        isDay ? "bg-[#fbefcc]/40" : "bg-slate-100/50"
      )}>
        {isWinner && (
          <div className="absolute top-0 right-0 p-1 bg-white text-emerald-600 rounded-bl-xl font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] px-3 py-1 shadow-sm z-10 border-l border-b border-white">
            WINNER
          </div>
        )}
        
        <div className="flex flex-col relative z-10 w-full min-w-0 pt-2 sm:pt-0">
           <div className="flex items-center gap-3 w-full">
             <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-soft-sm text-white",
                isDay ? "bg-amber-500 shadow-amber-200" : "bg-slate-800 shadow-slate-300"
             )}>
                {isDay ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
             </div>
             <div className="flex flex-col flex-1 min-w-0 pr-10 sm:pr-0">
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
               <span className="text-sm sm:text-lg font-black uppercase font-display tracking-tighter text-slate-800 break-words leading-tight">{log.operatorName}</span>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 relative z-10">
          <div className="bg-white/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col gap-1 border border-white/40 shadow-soft-sm">
             <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Design Name</span>
             <span className="text-xs sm:text-sm font-black w-full break-words text-slate-800 leading-tight">{log.designName}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-white/60 p-2 sm:p-3 rounded-xl flex flex-col gap-1 border border-white/40 items-center justify-center text-center shadow-soft-sm min-h-[4rem]">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Design Stitches</span>
              <span className="text-xs sm:text-sm font-black font-mono text-slate-800">{log.designStitch.toLocaleString()}</span>
            </div>
            <div className="bg-white/60 p-2 sm:p-3 rounded-xl flex flex-col gap-1 border border-white/40 items-center justify-center text-center shadow-soft-sm min-h-[4rem]">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Frame</span>
              <span className="text-xs sm:text-sm font-black font-mono text-slate-800">{log.frame}</span>
            </div>
            <div className="bg-white/60 p-2 sm:p-3 rounded-xl flex flex-col gap-1 border border-white/40 items-center justify-center text-center shadow-soft-sm col-span-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Meters</span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-600">{log.totalMeters}m</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-slate-100 shadow-sm mt-1">
             <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none text-center">Total Stitch</span>
             <span className={cn(
               "text-xl sm:text-4xl font-black font-display tracking-tighter leading-tight text-center break-all w-full",
               isWinner ? "text-emerald-500" : isLoser ? "text-rose-500" : "text-indigo-600"
             )}>{log.totalStitches.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: (e: any) => void }) {
  const colors: Record<string, string> = {
    indigo: "text-blue-500",
    rose: "text-rose-500"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "pill-button rounded-[2rem] sm:rounded-[2.5rem] w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-90 group/btn",
        colors[color]
      )}
    >
      <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover/btn:scale-110" />
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

