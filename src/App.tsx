import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  BarChart3, 
  Box, 
  Clock, 
  Filter, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Settings, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_DATA } from './constants';
import { ProductionItem, ProductionStatus, ProductionRecord } from './types';
import { MetricCard } from './components/MetricCard';
import { ProductionCard } from './components/ProductionCard';
import { AddMachineModal } from './components/AddMachineModal';
import { MachineDetail } from './components/MachineDetail';
import { cn } from './lib/utils';

export default function App() {
  const [items, setItems] = useState<ProductionItem[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductionStatus | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

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
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.id.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "ALL" || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  const handleAddItem = (newItem: ProductionItem) => {
    setItems(prev => {
      if (prev.some(item => item.id === newItem.id)) {
        // If ID exists, generate a new one
        return [{ ...newItem, id: `${newItem.id}-1` }, ...prev];
      }
      return [newItem, ...prev];
    });
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddProduction = (machineId: string, record: ProductionRecord) => {
    setItems(prev => prev.map(item => {
      if (item.id === machineId) {
        const logs = item.productionLogs || [];
        return {
          ...item,
          productionLogs: [record, ...logs],
          // Update some metrics if needed
          progress: Math.min(100, item.progress + 5)
        };
      }
      return item;
    }));
  };

  const selectedMachine = useMemo(() => {
    return items.find(i => i.id === selectedMachineId) || null;
  }, [items, selectedMachineId]);

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
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">Shift: Morning (A)</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase">06:00 — 14:00 • In Progress</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs ring-2 ring-indigo-50/50">
            VR
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
                {/* Stats Section */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {metrics.map((m, idx) => (
                    <MetricCard key={idx} {...m as any} />
                  ))}
                </section>

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
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Quick search..." 
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                        <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>All</FilterButton>
                        <FilterButton active={filter === "IN_PROGRESS"} onClick={() => setFilter("IN_PROGRESS")}>Running</FilterButton>
                        <FilterButton active={filter === "DELAYED"} onClick={() => setFilter("DELAYED")}>Alerts</FilterButton>
                        <FilterButton active={filter === "QUALITY_CHECK"} onClick={() => setFilter("QUALITY_CHECK")}>Inspect</FilterButton>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-8">
                    <AnimatePresence mode="popLayout">
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

                  {filteredItems.length === 0 && (
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

        {/* Action/Activities Sidebar */}
        <aside className="w-72 bg-slate-900 hidden h-full lg:flex flex-col p-6 shadow-2xl z-40 transition-all border-l border-slate-800">
          <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-8">System Activity Stream</h3>
          
          <div className="space-y-8 flex-1 overflow-y-auto scrollbar-hide pr-2">
            <ActivityItem 
              time="08:30 AM" 
              title="Target Sync" 
              desc="Line 01 throughput target increased by system." 
              type="info" 
            />
            <ActivityItem 
              time="08:12 AM" 
              title="Critical Stall" 
              desc="Emergency Stop triggered on Component Line 04." 
              type="alert" 
            />
            <ActivityItem 
              time="07:55 AM" 
              title="Staff Shift" 
              desc="Morning safety briefing completed and logged." 
              type="success" 
            />
            <ActivityItem 
              time="06:00 AM" 
              title="Sequence Start" 
              desc="Shift Alpha operational. Initial systems healthy." 
              type="neutral" 
            />
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Sync</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Secured</span>
              </div>
              <div className="flex gap-1.5 h-4 items-end">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 rounded-full",
                      i === 10 ? "bg-amber-500 h-[60%]" : "bg-emerald-500",
                      i % 3 === 0 ? "h-full" : i % 2 === 0 ? "h-[70%]" : "h-[85%]"
                    )} 
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Global Footer */}
      <footer className="shrink-0 bg-white border-t border-slate-200 px-8 py-2.5 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
            NETWORK: PT-SECURE-NODE
          </span>
          <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase hidden md:inline">ENCRYPTION: AES-256</span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | SYSTEM LOGGED: PT-998
        </div>
      </footer>
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
