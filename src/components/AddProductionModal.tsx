import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, User, Hash, Clock, FileText, Activity, Camera, Loader2, Calendar } from 'lucide-react';
import { ProductionRecord } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';

interface AddProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: ProductionRecord) => void;
  machineId: string;
  frameMeters?: number;
}

export function AddProductionModal({ isOpen, onClose, onAdd, machineId, frameMeters }: AddProductionModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [productionDate, setProductionDate] = useState(getYesterdayDate());
  const [currentShift, setCurrentShift] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftsData, setShiftsData] = useState<Record<'DAY' | 'NIGHT', {
    operatorName: string;
    designName: string;
    designStitch: number;
    frame: number;
    totalMeters: number;
    totalStitches: number;
  }>>({
    DAY: { operatorName: '', designName: '', designStitch: 0, frame: 0, totalMeters: 0, totalStitches: 0 },
    NIGHT: { operatorName: '', designName: '', designStitch: 0, frame: 0, totalMeters: 0, totalStitches: 0 },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save both shifts if they have data
    const shifts: ('DAY' | 'NIGHT')[] = ['DAY', 'NIGHT'];
    let recordsAdded = 0;

    shifts.forEach(shift => {
      const data = shiftsData[shift];
      // Only save if at least some data is entered (design name is a good indicator)
      if (data.designName.trim() || data.operatorName.trim()) {
        const newRecord: ProductionRecord = {
          id: `LOG-${Date.now().toString().slice(-6)}-${shift}`,
          machineId: machineId,
          date: productionDate,
          shift: shift,
          ...data
        };
        onAdd(newRecord);
        recordsAdded++;
      }
    });

    if (recordsAdded > 0) {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(value) || 0 : value;

    if (name === 'date') {
      setProductionDate(value);
    } else {
      setShiftsData(prev => {
        const currentData = { ...prev[currentShift], [name]: val };
        
        // Auto calculate totalMeters if frame or frameMeters is involved
        if (name === 'frame' && frameMeters) {
          currentData.totalMeters = Number(((val as number) * frameMeters).toFixed(2));
        }

        return {
          ...prev,
          [currentShift]: currentData
        };
      });
    }
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const prompt = `Extract production data from this hand-written sheet image.
          Look for these specific columns and labels:
          - "દીન પાલી" (Din Pali) for Day Shift.
          - "રાત પાલી" (Rat Pali) for Night Shift.
          - "તારીખ" (Date) - Extract in YYYY-MM-DD format.
          - "ઓપરેટર કા નામ" - Name of the person working.
          - "ડિ.નંબર" (Design Number) - This is the Design Name (e.g., 21).
          - "કુલ નંગ" or the bottom total in the frame column - This is the Frame count (e.g., 27).
          - "કુલ સ્ટીચ" (Kul Stitch) - The large number for total stitches (e.g., 228577).
          - "વર્ક નામ" (Work Name) - Types like Pallu, Skirt.

          Return a JSON object with a "date" field and a "shifts" array (DAY and NIGHT).
          Each shift object MUST have: "shift", "operatorName", "designName" (from ડિ.નંબર), "designStitch" (number), "frame" (number, usually from the bottom total), "totalMeters" (number), "totalStitches" (from કુલ સ્ટીચ).`;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                  shifts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        shift: { type: Type.STRING, enum: ["DAY", "NIGHT"] },
                        operatorName: { type: Type.STRING },
                        designName: { type: Type.STRING },
                        designStitch: { type: Type.NUMBER },
                        frame: { type: Type.NUMBER },
                        totalMeters: { type: Type.NUMBER },
                        totalStitches: { type: Type.NUMBER },
                      },
                      required: ["shift"]
                    }
                  }
                }
              }
            }
          });

          const text = response.text;
          
          if (text) {
            const result = JSON.parse(text.trim());
            if (result.date) setProductionDate(result.date);
            
            if (Array.isArray(result.shifts)) {
              setShiftsData(prev => {
                const newData = { ...prev };
                result.shifts.forEach((s: any) => {
                  const shiftKey = s.shift === 'NIGHT' ? 'NIGHT' : 'DAY';
                  const frameCount = Number(s.frame) || 0;
                  const calculatedMeters = frameMeters ? Number((frameCount * frameMeters).toFixed(2)) : (Number(s.totalMeters) || 0);

                  newData[shiftKey] = {
                    operatorName: s.operatorName || '',
                    designName: s.designName || '',
                    designStitch: Number(s.designStitch) || 0,
                    frame: frameCount,
                    totalMeters: calculatedMeters,
                    totalStitches: Number(s.totalStitches) || 0,
                  };
                });
                return newData;
              });
            }
          }
        } catch (error) {
          console.error("AI Scan error:", error);
        } finally {
          setIsScanning(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("FileReader error:", error);
      setIsScanning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">New Entry</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Machine: {machineId}</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleScan} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
              {/* AI Scan Action */}
              <div 
                onClick={() => !isScanning && fileInputRef.current?.click()}
                className={cn(
                  "relative group cursor-pointer border-2 border-dashed rounded-3xl p-4 sm:p-6 transition-all overflow-hidden",
                  isScanning ? "bg-slate-50 border-slate-200" : "bg-indigo-50/30 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                )}
              >
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <motion.div 
                      initial={{ top: "-10%" }}
                      animate={{ top: "110%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-30"
                    />
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  </div>
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "p-3 sm:p-4 rounded-2xl shadow-sm transition-all shrink-0",
                    isScanning ? "bg-white text-indigo-600 animate-pulse" : "bg-white text-indigo-600 group-hover:scale-110 group-hover:rotate-3 shadow-indigo-100"
                  )}>
                    {isScanning ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Camera className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-black text-slate-800 tracking-tight uppercase">
                      {isScanning ? 'AI Scanning...' : 'Scan Sheet'}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {isScanning ? 'Extracting shift data' : 'Take photo or upload'}
                    </p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleScan} 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormGroup label="Production Date" icon={Calendar}>
                    <input name="date" type="date" required value={productionDate || ''} onChange={handleChange} className="form-input" />
                  </FormGroup>
 
                  <FormGroup label="Working Shift" icon={Clock}>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentShift('DAY')}
                        className={cn(
                          "py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2",
                          currentShift === 'DAY'
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        Day Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentShift('NIGHT')}
                        className={cn(
                          "py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2",
                          currentShift === 'NIGHT'
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        Night Shift
                      </button>
                    </div>
                  </FormGroup>
 
                  <FormGroup label="Operator Name" icon={User}>
                    <input name="operatorName" required value={shiftsData[currentShift].operatorName || ''} onChange={handleChange} className="form-input" />
                  </FormGroup>
                </div>
 
                <div className="space-y-4">
                  <FormGroup label="Design Name" icon={FileText}>
                    <input name="designName" required value={shiftsData[currentShift].designName || ''} onChange={handleChange} className="form-input" />
                  </FormGroup>
 
                  <div className="grid grid-cols-2 gap-4">
                    <FormGroup label="Tich" icon={Activity}>
                      <input name="designStitch" type="number" required value={shiftsData[currentShift].designStitch ?? 0} onChange={handleChange} className="form-input" />
                    </FormGroup>
                    <FormGroup label="Frame" icon={Hash}>
                      <input name="frame" type="number" required value={shiftsData[currentShift].frame ?? 0} onChange={handleChange} className="form-input" />
                    </FormGroup>
                  </div>
 
                  <FormGroup label="Meters" icon={Plus}>
                    <input name="totalMeters" type="number" step="0.01" required value={shiftsData[currentShift].totalMeters ?? 0} onChange={handleChange} className="form-input" />
                  </FormGroup>
 
                  <FormGroup label="Total Stitch" icon={Activity}>
                    <input name="totalStitches" type="number" required value={shiftsData[currentShift].totalStitches ?? 0} onChange={handleChange} className="form-input" />
                  </FormGroup>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    Save Production Record
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormGroup({ label, children, icon: Icon }: { label: string, children: React.ReactNode, icon: any }) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {children}
      </div>
    </div>
  );
}
