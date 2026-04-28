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
  Pencil
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
      <div className="bento-card p-8 sm:p-14 relative overflow-hidden group flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full group-hover:bg-indigo-600/10 transition-colors duration-1000 translate-x-1/3 -translate-y-1/3" />
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10 relative z-10 w-full sm:w-auto">
          <div className="flex flex-col text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-6">
              <h2 className="text-5xl sm:text-8xl font-black text-slate-800 font-display tracking-tighter leading-tight uppercase italic drop-shadow-sm pr-2">
                {item.id}
              </h2>
              {item.machineHead && (
                <span className="text-4xl sm:text-7xl font-black text-indigo-500 font-display uppercase italic tracking-tighter self-center sm:self-end sm:mb-1 drop-shadow-sm">
                  HEAD {item.machineHead}
                </span>
              )}
            </div>
          </div>
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
          <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 px-8 shadow-sm">
            <LegendItem color="bg-rose-500" label="Zero" />
            <LegendItem color="bg-amber-500" label="Partial" />
            <LegendItem color="bg-emerald-500" label="Saturated" />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <ShiftSideCard 
                    shift="DAY" 
                    log={shifts.DAY} 
                    title="SOLAR DEPLOYMENT"
                    accentColor="amber"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
                    comparison={shifts.DAY && shifts.NIGHT ? (shifts.DAY.totalStitches >= shifts.NIGHT.totalStitches ? 'higher' : 'lower') : undefined}
                  />
                  <ShiftSideCard 
                    shift="NIGHT" 
                    log={shifts.NIGHT} 
                    title="LUNAR DEPLOYMENT"
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

      {/* Mobile FAB for Detail View Actions */}
      <div className="fixed bottom-24 right-6 z-[60]">
        <DetailMobileActions 
          onAdd={() => setIsAddModalOpen(true)}
          onDelete={() => onDeleteMachine(item.id)}
        />
      </div>
    </motion.div>
  );
}

function DetailMobileActions({ onAdd, onDelete }: { onAdd: () => void, onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[59]"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="absolute bottom-20 right-0 w-64 soft-card border border-white/40 p-5 space-y-4 z-[60]"
            >
              <button 
                onClick={() => { onAdd(); setIsOpen(false); }}
                className="w-full flex items-center gap-4 p-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 shadow-bold"
              >
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-4 h-4" />
                </div>
                <span>Add Record</span>
              </button>
              <button 
                onClick={() => { onDelete(); setIsOpen(false); }}
                className="w-full flex items-center gap-4 p-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span>Delete Machine</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center transition-all z-[61] relative border-4 border-white",
          isOpen ? "bg-slate-900 text-white scale-90" : "bg-indigo-600 text-white"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
        >
          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
        </motion.div>
      </motion.button>
    </div>
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

      {/* Header Accent */}
      <div className={cn(
        "px-10 py-10 flex items-center justify-between relative overflow-hidden",
        isWinner ? "bg-[#bdfedb]/50 text-emerald-900" : 
        isLoser ? "bg-[#fedbdc]/50 text-rose-900" :
        isDay ? "bg-[#fbefcc]/60 text-amber-900" : "bg-[#bde0fe]/50 text-blue-900"
      )}>
        {isWinner && (
          <div className="absolute top-0 right-0 p-1 bg-white text-emerald-600 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] px-8 py-4 shadow-sm z-10 border-l border-b border-white">
            CHAMPION SHIFT
          </div>
        )}
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={cn(
            "w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-soft-sm bg-white",
            isWinner ? "text-emerald-500" :
            isLoser ? "text-rose-400" :
            isDay ? "text-amber-500" : "text-blue-500"
          )}>
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.6em] opacity-40 mb-2">{title}</h4>
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 opacity-30" />
              <span className="text-2xl font-black uppercase font-display tracking-tighter">{log.operatorName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="p-10 grid grid-cols-2 gap-8">
        <div className="bg-[#bde0fe]/10 p-8 rounded-[3rem] border border-white/60 shadow-soft-sm group-hover:bg-white transition-colors duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-6 rounded-full bg-blue-200" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Head Unit</p>
          </div>
          <p className="text-xl font-black text-slate-800 uppercase truncate leading-tight mb-6 tracking-tight">{log.designName}</p>
          <div className="flex items-center gap-4 text-blue-600 bg-white px-6 py-3 rounded-[1.5rem] w-fit shadow-soft-sm">
            <Hash className="w-5 h-5 opacity-50" />
            <span className="text-base font-black font-mono">{log.designStitch.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#ffafcc]/10 p-8 rounded-[3rem] border border-white/60 shadow-soft-sm group-hover:bg-white transition-colors duration-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-6 rounded-full bg-[#ffafcc]/40" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Cycles</p>
            </div>
            <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{log.frame}</span>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-white/60">
            <div className="flex items-center gap-4">
              <div className="w-3 h-6 rounded-full bg-emerald-200" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Net Dist.</p>
            </div>
            <span className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{log.totalMeters}m</span>
          </div>
        </div>

        <div className={cn(
          "col-span-2 p-14 rounded-[4rem] border-none flex flex-col items-center justify-center relative overflow-hidden group/metric transition-all duration-700 bg-white soft-inset",
        )}>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.6em] mb-8 relative z-10">Telemetry Output</p>
          <div className="flex items-center gap-10 relative z-10">
            <div className={cn(
              "text-7xl sm:text-9xl font-black font-display tracking-tighter",
              isWinner ? "text-emerald-500" : isLoser ? "text-rose-400" : "text-slate-700"
            )}>
              {log.totalStitches.toLocaleString()}
            </div>
            <div className={cn(
              "w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-soft bg-white",
              isWinner ? "text-emerald-500" :
              isLoser ? "text-rose-400" : "text-indigo-400"
            )}>
              <Activity className="w-10 h-10" />
            </div>
          </div>
          <div className="mt-10 flex items-center gap-8">
            <span className="w-16 h-0.5 bg-slate-100" />
            <span className="text-[12px] font-bold text-slate-300 uppercase tracking-[0.5em] italic">Nexus Synched</span>
            <span className="w-16 h-0.5 bg-slate-100" />
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

