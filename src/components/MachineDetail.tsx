import React, { useMemo, useEffect, useState } from 'react';
import { ProductionItem, ProductionRecord } from '../types';
import { motion } from 'motion/react';
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

interface MachineDetailProps {
  item: ProductionItem;
  onBack: () => void;
  key?: React.Key;
}

export function MachineDetail({ item, onBack }: MachineDetailProps) {
  const { user } = useFirebase();
  const [logs, setLogs] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState<ProductionRecord | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

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
      </div>

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ShiftSideCard 
                    shift="DAY" 
                    log={shifts.DAY} 
                    title="Day Shift"
                    accentColor="amber"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
                  />
                  <ShiftSideCard 
                    shift="NIGHT" 
                    log={shifts.NIGHT} 
                    title="Night Shift"
                    accentColor="slate"
                    onDelete={setLogToDelete}
                    onEdit={setEditLog}
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
    </motion.div>
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

function ShiftSideCard({ shift, log, title, accentColor, onDelete, onEdit }: ShiftSideCardProps) {
  if (!log) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group transition-all opacity-40 grayscale">
        <Clock className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">No entry for this shift</p>
      </div>
    );
  }

  const isDay = shift === 'DAY';

  return (
    <div className={cn(
      "relative bg-white border-2 rounded-[2.5rem] overflow-hidden transition-all shadow-sm",
      isDay ? "border-amber-100 hover:border-amber-400" : "border-slate-100 hover:border-slate-800 shadow-slate-100"
    )}>
      {/* Header */}
      <div className={cn(
        "px-6 py-4 flex justify-between items-center border-b",
        isDay ? "bg-amber-50/50 border-amber-100" : "bg-slate-900 border-slate-900 text-white"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            isDay ? "bg-amber-400 text-white" : "bg-slate-700 text-white"
          )}>
            {isDay ? <Clock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
              <User className="w-3 h-3" />
              <span className="text-xs font-black uppercase">{log.operatorName}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">Design</p>
            <p className="text-sm font-black uppercase tracking-tight">{log.designName}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
              }}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                isDay ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200" : "bg-slate-700 text-indigo-300 hover:bg-slate-600 hover:text-white"
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (log.id) onDelete(log.id);
              }}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                isDay ? "bg-rose-100 text-rose-600 hover:bg-rose-200" : "bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tich (Stitch)</p>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-lg font-black text-slate-800">{log.designStitch.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Frame</p>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-lg font-black text-slate-800">{log.frame}</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-50 pt-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meter</p>
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-lg font-black text-slate-800">{log.totalMeters}m</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-50 pt-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Stitches</p>
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-lg font-black text-slate-800">{log.totalStitches.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div className={cn(
        "h-1.5 w-full",
        isDay ? "bg-amber-400" : "bg-slate-900"
      )} />
    </div>
  );
}

