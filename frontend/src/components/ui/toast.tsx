import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast, Toast as ToastType } from '../../hooks/use-toast';

// Individual toast
const Toast: React.FC<{
  toast: ToastType;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200); // Match transition duration
  };
  
  return (
    <div
      className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 mb-2 transition-all duration-200 ease-in-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      } ${
        toast.variant === 'destructive' 
          ? 'border-l-4 border-red-500'
          : 'border-l-4 border-primary'
      }`}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm text-gray-500">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            className="ml-4 bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={handleDismiss}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast container
export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();
  
  return (
    <div className="fixed top-0 right-0 p-4 max-h-screen overflow-hidden flex flex-col items-end z-50 pointer-events-none">
      <div className="space-y-2 w-full max-w-md pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  );
}; 