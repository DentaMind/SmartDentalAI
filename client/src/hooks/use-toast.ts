import { toast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function useToast() {
  return {
    toast: ({ title, description, action, duration }: ToastProps) => {
      toast(title, {
        description,
        action: action
          ? {
              label: action.label,
              onClick: action.onClick,
            }
          : undefined,
        duration: duration || 5000,
      });
    },
    success: (message: string) => {
      toast.success(message);
    },
    error: (message: string) => {
      toast.error(message);
    },
    warning: (message: string) => {
      toast.warning(message);
    },
    info: (message: string) => {
      toast.info(message);
    },
    dismiss: (toastId?: string) => {
      toast.dismiss(toastId);
    },
  };
}
