import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
            <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="soft-card w-full max-w-sm overflow-hidden"
          >
            <div className="p-8 text-center bg-[#f6efe9]">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
                variant === 'danger' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
              )}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {message}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="pill-button py-4 px-6 text-slate-600 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-[0.98]"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "py-4 px-6 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                    variant === 'danger' ? "pill-button-danger border border-rose-500" : "pill-button-primary border border-white/60"
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
