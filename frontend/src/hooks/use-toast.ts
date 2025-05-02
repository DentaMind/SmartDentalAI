import { useState, useEffect, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Centralized toast state
const toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

// Notify all listeners when toasts change
const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

// Add a new toast
const addToast = (options: ToastOptions): string => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: Toast = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant || 'default',
  };
  
  toasts.push(toast);
  notifyListeners();
  
  // Auto remove toast after duration
  if (options.duration !== -1) {
    setTimeout(() => {
      removeToast(id);
    }, options.duration || 5000);
  }
  
  return id;
};

// Remove a toast by ID
const removeToast = (id: string) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
};

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  // Register as a listener
  useEffect(() => {
    const updateToasts = (newToasts: Toast[]) => {
      setLocalToasts(newToasts);
    };
    
    listeners.push(updateToasts);
    updateToasts([...toasts]);
    
    return () => {
      listeners = listeners.filter(listener => listener !== updateToasts);
    };
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    return addToast(options);
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toast,
    dismiss,
    toasts: localToasts,
  };
} 