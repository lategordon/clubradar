'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'warning' | 'info' | 'purple';
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    info: Info,
    purple: Sparkles,
  };

  const Icon = icons[toast.type || 'purple'];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300',
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : toast.type === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-950'
          : toast.type === 'info'
          ? 'border-blue-200 bg-blue-50 text-blue-950'
          : 'border-purple-200 bg-white/95 backdrop-blur-md text-slate-900 ring-1 ring-purple-100'
      )}
    >
      <div className="shrink-0 mt-0.5">
        {toast.type === 'success' ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : toast.type === 'warning' ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-2xs">
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#57068c] text-white shadow-2xs">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-snug opacity-85">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-700 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
