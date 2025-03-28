import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}