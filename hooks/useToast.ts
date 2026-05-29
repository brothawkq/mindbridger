import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms — varsayılan 4000
}

// [FIX #15] Hızlı ardışık çağrılarda ekranın toast'la dolmasını önler
const MAX_TOASTS = 5;

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();

    set((state) => ({
      // [FIX #15] Eski en başındaki toast'u silerek MAX_TOASTS sınırını koru
      toasts: [
        ...state.toasts.slice(-(MAX_TOASTS - 1)),
        { ...toast, id },
      ],
    }));

    // Otomatik kaldır
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/** Bileşenlerden toast tetiklemek için kısayol hook */
export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: "error", title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
    custom: (toast: Omit<Toast, "id">) => addToast(toast),
  };
}
