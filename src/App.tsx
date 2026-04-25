import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  BarChart3, 
  Box, 
  Filter, 
  LayoutDashboard, 
  Plus, 
  Settings, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductionItem, ProductionStatus, ProductionRecord } from './types';
import { MetricCard } from './components/MetricCard';
import { ProductionCard } from './components/ProductionCard';
import { AddMachineModal } from './components/AddMachineModal';
import { MachineDetail } from './components/MachineDetail';
import { cn } from './lib/utils';
import { useFirebase } from './context/FirebaseContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

export default function App() {
  const { user, loading, login, logout } = useFirebase();
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [filter, setFilter] = useState<ProductionStatus | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsInitialLoading(false);
      return;
    }

    const q = query(collection(db, 'machines'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const machines: ProductionItem[] = [];
      snapshot.forEach((doc) => {
        machines.push({ ...doc.data() as ProductionItem, id: doc.id });
      });
      setItems(machines);
      setIsInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'machines');
    });

    return unsubscribe;
  }, [user]);

  const metrics = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.status === 'COMPLETED').length;
    const active = items.filter(i => ['IN_PROGRESS', 'QUALITY_CHECK'].includes(i.status)).length;
    const delayed = items.filter(i => i.status === 'DELAYED').length;

    return [
      { label: "Target Output", value: "4,800", change: 65, trend: "up", icon: Activity },
      { label: "Current Efficiency", value: "94.2%", change: 2.4, trend: "up", icon: CheckCircle2 },
      { label: "Active Machines", value: active.toString(), change: -2, trend: "neutral", icon: BarChart3 },
      { label: "Total Downtime", value: "12m", change: -8, trend: "down", icon: AlertCircle },
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesFilter = filter === "ALL" || item.status === filter;
      return matchesFilter;
    });
  }, [items, filter]);

  const handleAddItem = async (newItem: ProductionItem) => {
    if (!user) return;
    const machineId = newItem.id || Math.random().toString(36).slice(2, 9);
    const path = `machines/${machineId}`;
    try {
      await setDoc(doc(db, 'machines', machineId), {
        ...newItem,
        id: machineId,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    const path = `machines/${id}`;
    try {
      await deleteDoc(doc(db, 'machines', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddProduction = async (machineId: string, record: ProductionRecord) => {
    if (!user) return;
    const path = `machines/${machineId}/logs`;
    try {
      // Add log to subcollection
      await addDoc(collection(db, 'machines', machineId, 'logs'), {
        ...record,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Update machine progress (simulation of business logic)
      const machineRef = doc(db, 'machines', machineId);
      const machineSnap = await getDoc(machineRef);
      if (machineSnap.exists()) {
        const currentProgress = machineSnap.data().progress || 0;
        await updateDoc(machineRef, {
          progress: Math.min(100, currentProgress + 5),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const selectedMachine = useMemo(() => {
    return items.find(i => i.id === selectedMachineId) || null;
  }, [items, selectedMachineId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading PT System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-8 border border-slate-200"
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <Box className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">PT PRODUCTION TRACKER</h1>
            <p className="text-slate-500 mt-2 font-medium">Please sign in to access your dashboard</p>
          </div>
          <button 
            onClick={login}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200 active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            <span>Connect with Google</span>
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure AES-256 Authentication</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col transition-all">
      <AddMachineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddItem} 
      />
      {/* Sleek Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex justify-between items-center z-50 sticky top-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">PT <span className="text-indigo-600">v2.4</span></h1>
            <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden xs:block">Intelligence Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-[10px] font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center transition-transform hover:scale-105">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-slate-400 font-bold text-xs">{(user.displayName || 'U').charAt(0)}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row xl:container xl:mx-auto">
        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-smooth">
          <AnimatePresence mode="wait">
            {selectedMachine ? (
              <MachineDetail 
                key="detail"
                item={selectedMachine} 
                onBack={() => setSelectedMachineId(null)} 
              />
            ) : (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Lines Status Overview */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Lines</h3>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Machine</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                        <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>All</FilterButton>
                        <FilterButton active={filter === "IN_PROGRESS"} onClick={() => setFilter("IN_PROGRESS")}>Running</FilterButton>
                        <FilterButton active={filter === "DELAYED"} onClick={() => setFilter("DELAYED")}>Alerts</FilterButton>
                        <FilterButton active={filter === "QUALITY_CHECK"} onClick={() => setFilter("QUALITY_CHECK")}>Inspect</FilterButton>
                      </div>
                    </div>
                  </div>

                  {isInitialLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-8">
                      <AnimatePresence>
                        {filteredItems.map((item) => (
                          <ProductionCard 
                            key={item.id} 
                            item={item} 
                            onDelete={handleDeleteItem} 
                            onAddProduction={handleAddProduction}
                            onClick={() => setSelectedMachineId(item.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {!isInitialLoading && filteredItems.length === 0 && (
                    <div className="py-20 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <Activity className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-900">No matching lines detected</p>
                      <p className="text-sm text-slate-500">Adjustment of telemetry filters required.</p>
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function ActivityItem({ time, title, desc, type }: { time: string, title: string, desc: string, type: 'info' | 'alert' | 'success' | 'neutral' }) {
  const dotColors = {
    info: "bg-indigo-400",
    alert: "bg-rose-500",
    success: "bg-emerald-500",
    neutral: "bg-slate-500"
  };

  return (
    <div className="relative pl-6 border-l border-slate-800">
      <div className={cn("absolute w-2 h-2 rounded-full -left-[4.5px] top-1", dotColors[type])} />
      <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">{time}</p>
      <h4 className="text-xs font-bold text-slate-200 mb-0.5">{title}</h4>
      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider border",
        active 
          ? "bg-slate-900 text-white border-slate-900" 
          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}
