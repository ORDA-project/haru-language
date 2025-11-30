import { atom } from 'jotai';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

export interface ErrorState {
  message: string;
  code?: string;
  timestamp: number;
}

// Toast messages atom
export const toastMessagesAtom = atom<ToastMessage[]>([]);

// Global error atom
export const globalErrorAtom = atom<ErrorState | null>(null);

// Toast actions
export const addToastAtom = atom(
  null,
  (get, set, toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      duration: toast.duration ?? (toast.type === 'error' ? 5000 : 3000)
    };
    
    const currentToasts = get(toastMessagesAtom);
    const updatedToasts = [...currentToasts, newToast];
    
    // Limit to maximum 2 toasts
    if (updatedToasts.length > 2) {
      updatedToasts.shift(); // Remove the oldest toast
    }
    
    set(toastMessagesAtom, updatedToasts);
  }
);

export const removeToastAtom = atom(
  null,
  (get, set, toastId: string) => {
    const currentToasts = get(toastMessagesAtom);
    set(toastMessagesAtom, currentToasts.filter(toast => toast.id !== toastId));
  }
);

export const clearAllToastsAtom = atom(
  null,
  (get, set) => {
    set(toastMessagesAtom, []);
  }
);

// Error actions
export const setGlobalErrorAtom = atom(
  null,
  (get, set, error: string | Error) => {
    const errorState: ErrorState = {
      message: error instanceof Error ? error.message : error,
      code: error instanceof Error ? error.name : undefined,
      timestamp: Date.now()
    };
    
    set(globalErrorAtom, errorState);
    
    // Also add error toast
    set(addToastAtom, {
      type: 'error',
      title: 'Error',
      message: errorState.message
    });
  }
);

export const clearGlobalErrorAtom = atom(
  null,
  (get, set) => {
    set(globalErrorAtom, null);
  }
);

// Success toast helper
export const showSuccessToastAtom = atom(
  null,
  (get, set, title: string, message?: string) => {
    set(addToastAtom, {
      type: 'success',
      title,
      message
    });
  }
);

// Warning toast helper
export const showWarningToastAtom = atom(
  null,
  (get, set, title: string, message?: string) => {
    set(addToastAtom, {
      type: 'warning',
      title,
      message
    });
  }
);

// Info toast helper
export const showInfoToastAtom = atom(
  null,
  (get, set, title: string, message?: string) => {
    set(addToastAtom, {
      type: 'info',
      title,
      message
    });
  }
);