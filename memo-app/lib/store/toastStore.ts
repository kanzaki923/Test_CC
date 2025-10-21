import { create } from 'zustand';
import { generateId } from '@/lib/utils/id';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast interface
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

/**
 * Input for adding a toast (without id, with optional type and duration)
 */
export interface AddToastInput {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Toast store state
 */
interface ToastStore {
  toasts: Toast[];
  addToast: (input: AddToastInput) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Default duration for toasts (3 seconds)
 */
const DEFAULT_DURATION = 3000;

/**
 * Toast store
 *
 * @example
 * ```tsx
 * const addToast = useToastStore(state => state.addToast);
 * const toasts = useToastStore(state => state.toasts);
 *
 * addToast({
 *   message: 'Memo saved successfully!',
 *   type: 'success',
 *   duration: 3000,
 * });
 * ```
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (input) => {
    const id = generateId('toast');
    const toast: Toast = {
      id,
      message: input.message,
      type: input.type || 'info',
      duration: input.duration ?? DEFAULT_DURATION,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
