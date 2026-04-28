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
  MessageSquare,
  Home,
  BookOpen,
  PenLine,
  User
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
      <div className="min-h-screen bg-[#fcfaf8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 soft-card flex items-center justify-center animate-pulse">
            <Box className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Synching Nexus Core...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full soft-card p-10 text-center space-y-10"
        >
          <div className="w-20 h-20 bg-white soft-shadow flex items-center justify-center mx-auto rounded-[2rem]">
            <Box className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase font-display">Nexus Core</h1>
            <p className="text-slate-400 mt-3 font-bold text-xs uppercase tracking-widest leading-loose">Access Restricted to Verified Fleet Nodes</p>
          </div>
          <button 
            onClick={login}
            disabled={isLoggingIn}
            className={`w-full py-5 pill-button-primary rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span>{isLoggingIn ? 'Authorizing...' : 'Initialize Google Auth'}</span>
          </button>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">Quantum-Secure Gateway v4.2</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 font-sans flex flex-col transition-all relative">
      <AddMachineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddItem} 
      />
      {/* Sleek Header */}
      <header className="px-4 sm:px-12 py-4 sm:py-8 flex justify-between items-center z-50 sticky top-0 shrink-0 w-full mx-auto bg-[#f6efe9]/80 backdrop-blur-xl border-b border-white">
        <div className="flex justify-between items-center w-full max-w-[1600px] mx-auto gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-10 relative z-10 w-full sm:w-auto overflow-hidden">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 sm:w-24 sm:h-24 bg-[#f6efe9] shadow-soft rounded-[1.2rem] sm:rounded-[2.5rem] flex items-center justify-center border border-white/40 shrink-0"
          >
            <Box className="w-6 h-6 sm:w-14 sm:h-14 text-[#ffafcc]" />
          </motion.div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-6xl font-black font-display tracking-tighter text-slate-800 leading-none flex flex-wrap">
              <span>Production</span><span className="text-[#bde0fe]">Tracker</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-20 relative z-10 shrink-0">
          <div className="hidden lg:flex items-center bg-[#f6efe9] shadow-soft-sm p-3 rounded-[3rem] border border-white/60">
            <NavButton 
              active={currentView === 'dashboard'} 
              onClick={() => { setCurrentView('dashboard'); setSelectedMachineId(null); }}
              icon={LayoutDashboard}
              label="Fleet"
              color="indigo"
            />
            <NavButton 
              active={currentView === 'whatsapp'} 
              onClick={() => { setCurrentView('whatsapp'); setSelectedMachineId(null); }}
              icon={MessageSquare}
              label="Comms"
              color="emerald"
            />
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[14px] font-black text-slate-700 uppercase tracking-tight font-display">{user.displayName}</span>
              <button onClick={logout} className="text-[10px] font-bold text-rose-300 hover:text-rose-400 transition-colors uppercase tracking-[0.4em] mt-1.5">Disconnect</button>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-[2rem] sm:rounded-[2.2rem] bg-[#f6efe9] shadow-soft-sm p-1.5 flex items-center justify-center border border-white"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-[1.6rem] sm:rounded-[1.8rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[1.6rem] sm:rounded-[1.8rem] bg-[#bde0fe] flex items-center justify-center text-blue-900 font-black text-xl sm:text-2xl">
                  {(user.displayName || 'U').charAt(0)}
                </div>
              )}
            </motion.div>
          </div>
        </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">
        <main className="flex-1 p-4 sm:p-12 space-y-12 scroll-smooth">
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
                className="space-y-12"
              >
                {/* Hero Section */}
                <section className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-end gap-12">
                    
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="hidden sm:flex pill-button w-full sm:w-auto px-16 py-8 text-rose-900 rounded-[3.5rem] font-black text-xs uppercase tracking-[0.5em] items-center justify-center gap-6 group"
                    >
                      <Plus className="w-8 h-8 transition-transform group-hover:rotate-180 duration-700" />
                      <span>Deploy New Asset</span>
                    </button>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                  {isInitialLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1
                          }
                        }
                      }}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 pb-32"
                    >
                      <AnimatePresence>
                        {filteredItems.map((item) => (
                          <motion.div
                            key={item.id}
                            variants={{
                              hidden: { opacity: 0, y: 20, scale: 0.95 },
                              show: { opacity: 1, y: 0, scale: 1 }
                            }}
                          >
                            <ProductionCard 
                              item={item} 
                              onDelete={() => setItemToDelete(item)} 
                              onEdit={() => setItemToEdit(item)}
                              onAddProduction={handleAddProduction}
                              onClick={() => setSelectedMachineId(item.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {!isInitialLoading && filteredItems.length === 0 && (
                    <div className="py-32 soft-card rounded-[3rem] border border-white flex flex-col items-center justify-center text-center">
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

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-4 rounded-[2rem] text-[11px] font-black transition-all cursor-pointer uppercase tracking-[0.3em] relative group flex-1 sm:flex-none text-center shadow-soft-sm hover:shadow-soft active:scale-95",
        active 
          ? "bg-slate-800 text-white" 
          : "bg-[#fcfaf8] text-slate-300 hover:text-slate-500"
      )}
    >
      {children}
    </button>
  );
}

function MobileNavigation({ currentView, onViewChange, onAdd, onLogout }: { 
  currentFilter: string, 
  onFilterChange: (f: string) => void,
  onAdd: () => void,
  onLogout: () => void,
  currentView: 'dashboard' | 'whatsapp',
  onViewChange: (v: 'dashboard' | 'whatsapp') => void
}) {
  return (
    <div className="sm:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-[60] w-max">
      <div className="bg-[#f6efe9] p-2 rounded-full shadow-soft flex items-center gap-2 border border-white/60">
        <button
          onClick={() => onViewChange('dashboard')}
          className={cn(
            "w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all",
            currentView === 'dashboard' ? "shadow-soft-inset text-blue-500" : "shadow-soft text-slate-500 hover:text-slate-800"
          )}
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange('whatsapp')}
          className={cn(
            "w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all",
            currentView === 'whatsapp' ? "shadow-soft-inset text-blue-500" : "shadow-soft text-slate-500 hover:text-slate-800"
          )}
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={onAdd}
          className="w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all shadow-soft text-slate-500 hover:text-slate-800 hover:shadow-soft-inset"
        >
          <PenLine className="w-4 h-4" />
        </button>
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all shadow-soft text-slate-500 hover:text-slate-800 hover:shadow-soft-inset"
        >
          <User className="w-4 h-4" />
        </button>
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

function FilterOption({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all text-left border border-transparent",
        active 
          ? "bg-white text-slate-800 shadow-soft border-white/60" 
          : "bg-[#fcfaf8] text-slate-400 hover:bg-white"
      )}
    >
      {children}
    </button>
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
    ? "bg-[#bde0fe] text-blue-900 shadow-soft-sm" 
    : "bg-[#ffafcc] text-rose-900 shadow-soft-sm";

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 group relative overflow-hidden active:scale-95",
        active ? activeClasses : "text-slate-300 hover:text-slate-500"
      )}
    >
      <motion.div
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: active ? Infinity : 0 }}
      >
        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-current" : "text-slate-300")} />
      </motion.div>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

