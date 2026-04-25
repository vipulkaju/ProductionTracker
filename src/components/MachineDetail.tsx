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
      {/* Deep Cinematic Header */}
      <div className="glass rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-12 border-white/50 shadow-2xl relative overflow-hidden group border-2 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/5 blur-[80px] sm:blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10 w-full sm:w-auto">
          <button 
            onClick={onBack}
            className="p-3 sm:p-5 glass rounded-2xl sm:rounded-3xl hover:bg-slate-900 hover:text-white transition-all text-slate-800 shadow-lg active:scale-90 self-start sm:self-center"
          >
            <ArrowLeft className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
          
          <div className="flex flex-col text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="p-1 px-3 bg-slate-900 text-white rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">{item.id}</span>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight sm:leading-none uppercase italic border-b-4 sm:border-b-8 border-indigo-500/30 pb-2">
              {item.name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-4">
              <div className="flex items-center gap-2 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100">
                <Box className="w-3.5 h-4 text-indigo-500" />
                <span className="text-[10px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-widest">{item.category}</span>
              </div>
              <StatusBadge status={item.status} className="px-3 py-1.5 text-[9px] sm:text-[10px]" />
            </div>
          </div>
        </div>

        <div className="flex-1" />
        
        <div className="hidden lg:grid grid-cols-2 gap-4 mr-10 relative z-10 w-full lg:w-auto">
          <div className="glass p-4 rounded-3xl border border-white text-center min-w-[120px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Availability</p>
            <h4 className="text-xl font-black text-slate-900">{item.progress}%</h4>
          </div>
          {item.frameMeters && (
            <div className="glass p-4 rounded-3xl border border-white text-center min-w-[120px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Payload Cap</p>
              <h4 className="text-xl font-black text-indigo-600 font-mono italic">{item.frameMeters}m</h4>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex lg:hidden w-full sm:w-auto items-center justify-center gap-3 px-6 py-4 sm:px-10 sm:py-5 premium-gradient text-white rounded-2xl sm:rounded-[2rem] transition-all font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl shadow-indigo-100 relative z-10 mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5" />
          <span>Log Record</span>
        </button>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="hidden lg:flex items-center gap-3 px-10 py-5 premium-gradient text-white rounded-[2rem] hover:scale-[1.03] transition-all font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 relative z-10 group shrink-0"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-180 transition-transform duration-500">
            <Plus className="w-5 h-5" />
          </div>
          <span>Log Record</span>
        </button>
      </div>


      {/* Monthly Uptime Heatmap */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Shift Tracker</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2 bg-slate-100/50 rounded-2xl backdrop-blur-sm px-4">
            <LegendItem color="bg-rose-500" label="None" />
            <LegendItem color="bg-amber-500" label="Partial" />
            <LegendItem color="bg-emerald-500" label="Full" />
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-6 shadow-sm overflow-hidden border-indigo-50">
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-31 gap-2.5">
            {monthlyUptimeData.map((day) => (
              <motion.div 
                key={day.dateStr}
                whileHover={{ y: -4, scale: 1.1 }}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center transition-all shadow-sm relative group",
                  day.status === 'NONE' ? "bg-rose-500/10 text-rose-600 border border-rose-100" :
                  day.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-600 border border-amber-100" :
                  "bg-emerald-500/10 text-emerald-600 border border-emerald-100"
                )}
              >
                <span className="text-[10px] font-black">{day.dayNum}</span>
                <div className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                  day.status === 'NONE' ? "bg-rose-500" :
                  day.status === 'PARTIAL' ? "bg-amber-500" :
                  "bg-emerald-500"
                )} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Production History Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Production History</h3>
            <div className="h-px bg-slate-100 mt-2" />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Telemetry...</p>
          </div>
        ) : logsByDate.length > 0 ? (
          <div className="space-y-16">
            {logsByDate.map(([date, shifts]) => (
              <div key={date} className="space-y-8 relative">
                <div className="flex items-center gap-6 sticky top-24 z-10 py-2">
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                      {formatDate(date)}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <ShiftSideCard 
                    shift="DAY" 
                    log={shifts.DAY} 
                    title="Day Shift"
                    accentColor="amber"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
                    comparison={shifts.DAY && shifts.NIGHT ? (shifts.DAY.totalStitches >= shifts.NIGHT.totalStitches ? 'higher' : 'lower') : undefined}
                  />
                  <ShiftSideCard 
                    shift="NIGHT" 
                    log={shifts.NIGHT} 
                    title="Night Shift"
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
          <div className="py-32 glass rounded-[3rem] border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight text-slate-300">Null records found</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs">Initialize production logging to record shifts.</p>
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
      <div className="sm:hidden fixed bottom-24 right-6 z-[60]">
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
              className="absolute bottom-20 right-0 w-64 glass rounded-[2.5rem] shadow-2xl overflow-hidden z-[60] border border-white/40 p-5 space-y-4"
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
      whileHover={{ scale: 1.01 }}
      onClick={() => setShowActions(!showActions)}
      className={cn(
        "relative glass border-2 rounded-[3rem] overflow-hidden transition-all shadow-sm flex flex-col cursor-pointer group card-shadow",
        isWinner ? "border-emerald-200 ring-2 ring-emerald-500 ring-offset-4" : 
        isLoser ? "border-rose-200" :
        isDay ? "border-amber-100" : "border-slate-200"
      )}
    >
      {/* Action Overlay */}
      <AnimatePresence>
        {(showActions) && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 z-20 bg-slate-900/80 flex items-center justify-center p-6 gap-6"
          >
            <ActionButton 
              icon={Pencil} 
              label="Edit" 
              color="indigo" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
                setShowActions(false);
              }} 
            />
            <ActionButton 
              icon={Trash2} 
              label="Delete" 
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
        "px-6 py-5 flex items-center justify-between border-b relative overflow-hidden",
        isWinner ? "bg-emerald-500 text-white border-emerald-600" : 
        isLoser ? "bg-rose-50 text-rose-900 border-rose-100" :
        isDay ? "bg-amber-400 text-white border-amber-500" : "bg-slate-900 text-white border-slate-800"
      )}>
        {isWinner && (
          <div className="absolute top-0 right-0 p-1 bg-white text-emerald-600 rounded-bl-xl font-black text-[8px] uppercase tracking-widest px-3 py-1.5 shadow-xl">
            Champion Shift
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
            isWinner ? "bg-white text-emerald-600" :
            isLoser ? "bg-rose-100 text-rose-600" :
            "bg-white text-slate-900"
          )}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 opacity-60" />
              <span className="text-sm font-black uppercase font-display">{log.operatorName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Design</p>
          <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-tight">{log.designName}</p>
          <div className="flex items-center gap-1.5 mt-2 text-indigo-500">
            <Hash className="w-3 h-3" />
            <span className="text-[10px] font-black">{log.designStitch.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Frame</p>
            <span className="text-[11px] font-black text-slate-800">{log.frame}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Meters</p>
            <span className="text-[11px] font-black text-emerald-600">{log.totalMeters}m</span>
          </div>
        </div>

        <div className={cn(
          "col-span-2 p-6 rounded-[2rem] border flex flex-col items-center justify-center relative overflow-hidden",
          isWinner ? "bg-emerald-50 border-emerald-100" :
          isLoser ? "bg-rose-50 border-rose-100" : "bg-indigo-50/50 border-indigo-100/50"
        )}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Net Production</p>
          <div className="flex items-baseline gap-2">
            <h2 className={cn(
              "text-4xl sm:text-5xl font-black font-display tracking-tighter",
              isWinner ? "text-emerald-700" : isLoser ? "text-rose-700" : "text-slate-900"
            )}>
              {log.totalStitches.toLocaleString()}
            </h2>
            <Activity className={cn("w-5 h-5", isWinner ? "text-emerald-500" : isLoser ? "text-rose-500" : "text-indigo-500")} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: (e: any) => void }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 hover:text-white hover:bg-indigo-500",
    rose: "text-rose-400 hover:text-white hover:bg-rose-500"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[2rem] sm:rounded-[2.5rem] w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-90 group/btn",
        colors[color]
      )}
    >
      <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover/btn:scale-110" />
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

