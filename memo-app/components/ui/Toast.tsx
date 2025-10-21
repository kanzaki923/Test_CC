"use client";

import { useEffect } from "react";
import { useToastStore, Toast as ToastType } from "@/lib/store/toastStore";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Toast icons based on type
 */
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast colors based on type
 */
const toastColors = {
  success: "bg-green-50 dark:bg-green-950 border-green-500 text-green-900 dark:text-green-100",
  error: "bg-red-50 dark:bg-red-950 border-red-500 text-red-900 dark:text-red-100",
  warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-900 dark:text-yellow-100",
  info: "bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-900 dark:text-blue-100",
};

/**
 * Individual toast item component
 */
interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = toastIcons[toast.type];

  // Auto-remove after duration
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg",
        "animate-slide-in-right",
        toastColors[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Toast container component
 * Displays all active toasts in a fixed position
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
