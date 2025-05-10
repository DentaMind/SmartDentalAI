import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast interface
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Create a toast context
const ToastContext = React.createContext<{
  showToast: (message: string, type: ToastType, duration?: number) => void;
}>({
  showToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

// Component for a single toast
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  // Background color based on type
  const getBackgroundColor = (): string => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`${getBackgroundColor()} text-white rounded-md shadow-lg p-4 mb-2 flex items-center justify-between`}
    >
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 ml-4"
      >
        &times;
      </button>
    </div>
  );
};

// Provider for toasts
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="top-right">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </Toaster>
    </ToastContext.Provider>
  );
};

// Main Toaster component
export const Toaster: React.FC<React.PropsWithChildren<ToasterProps>> = ({
  children,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Create a portal for the toaster
  return createPortal(
    <div className={`fixed ${positionClasses[position]} z-50 w-72`}>{children}</div>,
    document.body
  );
};

export default Toaster;