import React, { useMemo, useEffect, useState } from 'react';
import { ProductionItem, ProductionRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-12"
    >
      {/* Header Navigation */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onBack}
          className="p-1 sm:p-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all text-slate-600 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{item.name}</h2>
          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
            <span className="font-mono text-[9px] sm:text-xs font-bold text-slate-400">{item.id}</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[8px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.category}</span>
          </div>
        </div>
        <div className="flex-1" />
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>


      {/* Monthly Uptime Heatmap */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-slate-900 text-white rounded-lg sm:rounded-xl">
              <Calendar className="w-3.5 h-3.5 sm:w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-base font-black text-slate-800 uppercase tracking-tight">Shift Tracker — {format(new Date(), 'MMMM yyyy')}</h3>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <LegendItem color="bg-rose-500" label="No Entry" />
            <LegendItem color="bg-amber-500" label="Half (1 Shift)" />
            <LegendItem color="bg-emerald-500" label="Full (2 Shifts)" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 sm:p-6 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-31 gap-2">
            {monthlyUptimeData.map((day) => (
              <div 
                key={day.dateStr}
                className="flex flex-col items-center gap-1"
              >
                <div className={cn(
                  "w-full aspect-square rounded-lg flex items-center justify-center transition-all shadow-sm border-b-2",
                  day.status === 'NONE' ? "bg-rose-500 border-rose-600 shadow-rose-100" :
                  day.status === 'PARTIAL' ? "bg-amber-500 border-amber-600 shadow-amber-100" :
                  "bg-emerald-500 border-emerald-600 shadow-emerald-100"
                )}>
                  <span className="text-[9px] sm:text-[10px] font-black text-white">{day.dayNum}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production History Section */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-lg sm:rounded-xl">
            <FileText className="w-3.5 h-3.5 sm:w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-base font-black text-slate-800 uppercase tracking-tight">History</h3>
          <div className="flex-1 h-px bg-slate-200 ml-2" />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Logs...</p>
          </div>
        ) : logsByDate.length > 0 ? (
          <div className="space-y-12">
            {logsByDate.map(([date, shifts]) => (
              <div key={date} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    {formatDate(date)}
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
          <div className="py-20 bg-white border border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <Plus className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-black text-slate-800 uppercase text-sm tracking-widest">No entries yet</p>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wide">Add your first production log to see it here</p>
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
        title="Delete Record?"
        message="This action cannot be undone. Are you sure you want to delete this production entry?"
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
      <div className="sm:hidden fixed bottom-6 right-6 z-[60]">
        <DetailMobileActions 
          onAdd={() => setIsAddModalOpen(true)}
          onDelete={() => onDeleteMachine(item.id)}
        />
      </div>
    </motion.div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full shadow-sm", color)} />
      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
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
              className="absolute bottom-20 right-0 w-56 bg-white rounded-3xl shadow-2xl overflow-hidden z-[60] border border-slate-200 p-4 space-y-3"
            >
              <button 
                onClick={() => { onAdd(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
              <button 
                onClick={() => { onDelete(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm"
              >
                <Trash2 className="w-4 h-4" />
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
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors z-[61] relative",
          isOpen ? "bg-slate-900 text-white" : "bg-indigo-600 text-white"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
        >
          <Plus className="w-7 h-7" />
        </motion.div>
      </motion.button>
    </div>
  );
}


interface ShiftSideCardProps {
  shift: 'DAY' | 'NIGHT';
  log?: ProductionRecord;
  title: string;
  accentColor: 'amber' | 'slate';
  onDelete: (id: string) => void;
  onEdit: (record: ProductionRecord) => void;
}

function ShiftSideCard({ shift, log, title, accentColor, onDelete, onEdit, comparison }: ShiftSideCardProps & { comparison?: 'higher' | 'lower' }) {
  const [showActions, setShowActions] = useState(false);

  if (!log) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-[2rem] p-4 sm:p-8 flex flex-col items-center justify-center text-center group transition-all opacity-40 grayscale min-h-[160px] sm:min-h-0">
        <Clock className="w-5 h-5 sm:w-8 sm:h-8 text-slate-300 mb-2 sm:mb-3" />
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">No Entry</p>
      </div>
    );
  }

  const isDay = shift === 'DAY';
  const isWinner = comparison === 'higher';
  const isLoser = comparison === 'lower';

  return (
    <div 
      onClick={() => setShowActions(!showActions)}
      className={cn(
        "relative bg-white border-2 rounded-2xl sm:rounded-[2.5rem] overflow-hidden transition-all shadow-sm flex flex-col cursor-pointer group",
        isDay ? "border-amber-100" : "border-slate-100",
        isWinner && "ring-2 ring-emerald-500 ring-offset-1 border-emerald-200",
        isLoser && "ring-2 ring-rose-500 ring-offset-1 border-rose-200"
      )}
    >
      {/* Action Overlay */}
      <AnimatePresence>
        {(showActions) && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 z-20 bg-slate-900/60 flex items-center justify-center gap-4 px-4"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
                setShowActions(false);
              }}
              className="flex-1 max-w-[100px] aspect-square bg-white text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Pencil className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (log.id) onDelete(log.id);
                setShowActions(false);
              }}
              className="flex-1 max-w-[100px] aspect-square bg-rose-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={cn(
        "px-3 sm:px-6 py-2 sm:py-4 flex flex-col gap-1 border-b",
        isWinner ? "bg-emerald-50 border-emerald-100" : 
        isLoser ? "bg-rose-50 border-rose-100" :
        isDay ? "bg-amber-50/50 border-amber-100" : "bg-slate-900 border-slate-900 text-white"
      )}>
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isWinner ? "bg-emerald-500 text-white" :
              isLoser ? "bg-rose-500 text-white" :
              isDay ? "bg-amber-400 text-white" : "bg-slate-700 text-white"
            )}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={cn(
                "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] truncate",
                isLoser ? "text-rose-900" : isWinner ? "text-emerald-900" : ""
              )}>{title}</h4>
              <div className="flex items-center gap-1 mt-0.5 opacity-80 min-w-0">
                <User className="w-2.5 h-2.5 flex-shrink-0" />
                <span className={cn(
                  "text-[10px] sm:text-xs font-black uppercase truncate",
                  isLoser ? "text-rose-700" : isWinner ? "text-emerald-700" : ""
                )}>{log.operatorName}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-black/5 pt-1 mt-1 opacity-60">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-2.5 h-2.5 flex-shrink-0" />
            <span className={cn(
              "text-[9px] sm:text-xs font-black uppercase truncate",
              isLoser ? "text-rose-700" : isWinner ? "text-emerald-700" : ""
            )}>{log.operatorName}</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-5 flex flex-col gap-3 flex-1">
        {/* Row 1: Design | Design St */}
        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-50">
          <div className="min-w-0 flex flex-col">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Design Name</span>
            <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase truncate" title={log.designName}>{log.designName}</span>
          </div>
          <div className="min-w-0 flex flex-col text-right">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Design St</span>
            <div className="flex items-center justify-end gap-1">
              <Hash className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] sm:text-xs font-black text-slate-800">{log.designStitch.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Frame | Meters */}
        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-50">
          <div className="min-w-0 flex flex-col">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Frame</span>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] sm:text-xs font-black text-slate-800">{log.frame}</span>
            </div>
          </div>
          <div className="min-w-0 flex flex-col text-right">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Meters</span>
            <div className="flex items-center justify-end gap-1.5">
              <Ruler className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-black text-slate-800">{log.totalMeters}m</span>
            </div>
          </div>
        </div>

        {/* Row 3: Total Stitch (Main Result) */}
        <div className="flex flex-col items-center justify-center pt-1">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Tich</p>
          <div className="flex items-center gap-2">
            <Activity className={cn(
              "w-5 h-5",
              isWinner ? "text-emerald-500" : isLoser ? "text-rose-500" : "text-indigo-500"
            )} />
            <h2 className={cn(
              "text-2xl sm:text-4xl font-black tracking-tighter",
              isWinner ? "text-emerald-700" : isLoser ? "text-rose-700" : "text-slate-900"
            )}>{log.totalStitches.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div className={cn(
        "h-1.5 w-full mt-auto",
        isWinner ? "bg-emerald-500" :
        isLoser ? "bg-rose-500" :
        isDay ? "bg-amber-400" : "bg-slate-900"
      )} />
    </div>
  );
}

