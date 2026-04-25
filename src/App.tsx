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
  LogOut,
  Trash2,
  Zap,
  Clock,
  Timer,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductionItem, ProductionStatus, ProductionRecord } from './types';
import { MetricCard } from './components/MetricCard';
import { ProductionCard } from './components/ProductionCard';
import { AddMachineModal } from './components/AddMachineModal';
import { MachineDetail } from './components/MachineDetail';
import { WhatsAppReport } from './components/WhatsAppReport';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EditMachineModal } from './components/EditMachineModal';
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
  const { user, loading, isLoggingIn, login, logout } = useFirebase();
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [filter, setFilter] = useState<ProductionStatus | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<ProductionItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ProductionItem | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'whatsapp'>('dashboard');

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsInitialLoading(false);
      return;
    }

    const q = query(collection(db, 'machines'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const machines: ProductionItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ProductionItem;
        const machine = { ...data, id: docSnap.id };
        
        // One-time data correction for MCH-1 requested by user
        if (machine.id === 'MCH-1' && machine.machineArea === '250' && machine.machineHead !== '39') {
          const newHead = '39';
          const areaNum = parseFloat(machine.machineArea) || 0;
          const headNum = parseFloat(newHead) || 0;
          const newFrameMeters = Number(((headNum * areaNum) / 1000).toFixed(4));
          
          updateDoc(doc(db, 'machines', 'MCH-1'), {
            machineHead: newHead,
            frameMeters: newFrameMeters,
            updatedAt: serverTimestamp()
          }).catch(err => console.error("Failed to auto-update MCH-1:", err));
        }

        machines.push(machine);
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
      { label: "Target Output", value: "4,800", change: 65, trend: "up", icon: Activity, variant: "indigo" as const },
      { label: "Current Efficiency", value: "94.2%", change: 2.4, trend: "up", icon: CheckCircle2, variant: "emerald" as const },
      { label: "Active Machines", value: active.toString(), change: -2, trend: "neutral", icon: BarChart3, variant: "amber" as const },
      { label: "Total Downtime", value: "12m", change: -8, trend: "down", icon: AlertCircle, variant: "rose" as const },
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

  const handleDeleteItem = async () => {
    if (!user || !itemToDelete) return;
    const path = `machines/${itemToDelete.id}`;
    try {
      await deleteDoc(doc(db, 'machines', itemToDelete.id));
      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUpdateMachine = async (updatedItem: ProductionItem) => {
    if (!user) return;
    const path = `machines/${updatedItem.id}`;
    try {
      const machineRef = doc(db, 'machines', updatedItem.id);
      await updateDoc(machineRef, {
        name: updatedItem.name,
        category: updatedItem.category,
        machineHead: updatedItem.machineHead,
        machineArea: updatedItem.machineArea,
        frameMeters: updatedItem.frameMeters,
        status: updatedItem.status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
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
            disabled={isLoggingIn}
            className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-slate-200 active:scale-[0.98] ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'}`}
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span>{isLoggingIn ? 'Connecting...' : 'Connect with Google'}</span>
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure AES-256 Authentication</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col transition-all relative">
      <AddMachineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddItem} 
      />
      {/* Sleek Cinematic Header */}
      <header className="glass border-b border-indigo-100/50 px-4 sm:px-10 py-4 sm:py-6 flex justify-between items-center z-50 sticky top-0 shrink-0 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
        
        <div className="flex items-center gap-3 sm:gap-6 relative z-10">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            className="w-10 h-10 sm:w-14 sm:h-14 premium-gradient rounded-xl sm:rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-200 border border-white/20"
          >
            <Box className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-3xl font-black font-display tracking-tight text-slate-900 leading-none uppercase italic">
              Nexus<span className="text-indigo-600">Core</span>
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[7px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Node v2.8</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-10 relative z-10">
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
            <NavButton 
              active={currentView === 'dashboard'} 
              onClick={() => { setCurrentView('dashboard'); setSelectedMachineId(null); }}
              icon={LayoutDashboard}
              label="Fleet Dashboard"
              color="indigo"
            />
            <NavButton 
              active={currentView === 'whatsapp'} 
              onClick={() => { setCurrentView('whatsapp'); setSelectedMachineId(null); }}
              icon={MessageSquare}
              label="Transmission"
              color="emerald"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight font-display">{user.displayName}</span>
              <button onClick={logout} className="text-[9px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em] mt-0.5">Disconnect</button>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white border-2 border-indigo-100 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-100/50"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-xl premium-gradient flex items-center justify-center text-white font-black text-lg">
                  {(user.displayName || 'U').charAt(0)}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col xl:container xl:mx-auto">
        {/* Real-time Metrics Bar - REMOVED AS PER USER REQUEST */}
        
        <main className="flex-1 p-4 sm:p-8 space-y-8 scroll-smooth">
          <AnimatePresence mode="wait">
            {selectedMachine ? (
              <MachineDetail 
                key="detail"
                item={selectedMachine} 
                onBack={() => setSelectedMachineId(null)} 
                onAddProduction={handleAddProduction}
                onDeleteMachine={() => setItemToDelete(selectedMachine)}
              />
            ) : currentView === 'whatsapp' ? (
              <WhatsAppReport 
                key="whatsapp"
                onBack={() => setCurrentView('dashboard')}
                user={user}
              />
            ) : (
              <motion.div 
                key="dashboard"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  },
                  exit: { opacity: 0, y: -20 }
                }}
                className="space-y-8"
              >
                {/* Lines Status Overview */}
                <section className="space-y-6 sm:space-y-10">
                  <div className="flex justify-end border-b border-slate-100 pb-6 sm:pb-8">
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 premium-gradient text-white rounded-2xl sm:rounded-[2rem] hover:scale-[1.03] transition-all font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 group shrink-0"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-180 duration-500" />
                      <span>Add New Machine</span>
                    </button>
                  </div>

                  {isInitialLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-72 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-32">
                      <AnimatePresence>
                        {filteredItems.map((item) => (
                          <ProductionCard 
                            key={item.id} 
                            item={item} 
                            onDelete={() => setItemToDelete(item)} 
                            onEdit={() => setItemToEdit(item)}
                            onAddProduction={handleAddProduction}
                            onClick={() => setSelectedMachineId(item.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {!isInitialLoading && filteredItems.length === 0 && (
                    <div className="py-32 glass rounded-[3rem] border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                        <Activity className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">No match detected</h3>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs">Telemetry filters yielded zero matching operational assets.</p>
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Delete Machine?"
        message={`Are you sure you want to delete ${itemToDelete?.name}? This will permanently remove all production history for this machine.`}
        confirmText="Confirm Delete"
        variant="danger"
      />

      <EditMachineModal
        isOpen={!!itemToEdit}
        onClose={() => setItemToEdit(null)}
        item={itemToEdit}
        onUpdate={handleUpdateMachine}
      />

      {/* Mobile Floating Actions */}
      {!selectedMachineId && (
        <MobileNavigation 
          currentFilter={filter}
          onFilterChange={setFilter}
          onAdd={() => setIsModalOpen(true)}
          onLogout={logout}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}
    </div>
  );
}

function MobileNavigation({ currentFilter, onFilterChange, onAdd, onLogout, currentView, onViewChange }: { 
  currentFilter: ProductionStatus | "ALL", 
  onFilterChange: (f: ProductionStatus | "ALL") => void,
  onAdd: () => void,
  onLogout: () => void,
  currentView: 'dashboard' | 'whatsapp',
  onViewChange: (v: 'dashboard' | 'whatsapp') => void
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
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
              className="absolute bottom-20 right-0 w-64 bg-white rounded-3xl shadow-2xl overflow-hidden z-[60] border border-slate-200"
            >
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Navigation</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => { onViewChange('dashboard'); setIsOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-sm",
                        currentView === 'dashboard' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button 
                      onClick={() => { onViewChange('whatsapp'); setIsOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-sm",
                        currentView === 'whatsapp' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                      )}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Report</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Actions</p>
                  <button 
                    onClick={() => { onAdd(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Machine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Quick Filters</p>
                  <div className="grid grid-cols-1">
                    <FilterOption active={currentFilter === "ALL"} onClick={() => { onFilterChange("ALL"); setIsOpen(false); }}>All Machines</FilterOption>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Account</p>
                  <button 
                    onClick={() => { onLogout(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 p-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
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
          transition={{ type: "spring", damping: 12 }}
        >
          <Plus className="w-7 h-7" />
        </motion.div>
      </motion.button>
    </div>
  );
}

function FilterOption({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all text-left",
        active 
          ? "bg-slate-900 text-white" 
          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      )}
    >
      {children}
    </button>
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

function NavButton({ active, onClick, icon: Icon, label, color }: { 
  active: boolean, 
  onClick: () => void, 
  icon: any, 
  label: string, 
  color: 'indigo' | 'emerald' 
}) {
  const activeClasses = color === 'indigo' 
    ? "premium-gradient text-white shadow-xl shadow-indigo-200" 
    : "bg-emerald-600 text-white shadow-xl shadow-emerald-200";

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95",
        active ? activeClasses : "text-slate-400 hover:text-indigo-600 hover:bg-white"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 sm:px-6 py-2sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black transition-all whitespace-nowrap cursor-pointer uppercase tracking-[0.1em] sm:tracking-[0.2em] relative group flex-1 sm:flex-none text-center",
        active 
          ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105" 
          : "bg-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeFilter"
          className="absolute inset-0 bg-slate-900 rounded-2xl -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {children}
    </button>
  );
}

