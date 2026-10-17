"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info" }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);

      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl animate-slide-up transition-all",
              item.variant === "success" &&
                "bg-emerald-950/90 border-emerald-500/40 text-emerald-100",
              item.variant === "error" &&
                "bg-rose-950/90 border-rose-500/40 text-rose-100",
              item.variant === "info" &&
                "bg-slate-900/95 border-slate-700/80 text-slate-100"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {item.variant === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {item.variant === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              {item.variant === "info" && (
                <Info className="w-5 h-5 text-brand-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-5">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-xs opacity-85 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(item.id)}
              className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
