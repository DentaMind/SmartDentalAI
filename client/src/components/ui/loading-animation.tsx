import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// Import the DentaMind logo
import dentaMindLogo from "../../assets/dentamind-logo-tooth-hq.png"; // Use the high-quality logo

interface LoadingAnimationProps {
  className?: string;
}

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  const [visible, setVisible] = useState(true); // Start visible immediately
  const [loadingMessages, setLoadingMessages] = useState<string[]>([
    "Analyzing patient data...",
    "Loading AI models...",
    "Preparing dashboard...",
    "Optimizing diagnostics...",
    "Syncing dental records..."
  ]);
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((current) => (current + 1) % loadingMessages.length);
    }, 2000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [loadingMessages.length]);

  // We removed the visibility check to ensure logo is always shown
  
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent mb-4">DentaMind AI</h1>
      
      {/* DentaMind tooth logo with glow animation */}
      <div className="relative h-36 w-36 mb-6">
        {/* Background glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
        
        {/* Logo with glowing effect */}
        <div className="flex justify-center w-full relative z-10">
          <img 
            src={dentaMindLogo} 
            alt="DentaMind Logo" 
            className="w-[135px] h-[135px] animate-pulse-subtle"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(40, 199, 111, 0.7))'
            }}
          />
        </div>
      </div>
      
      {/* Loading text with DentaMind branding */}
      <p className="text-lg font-medium text-primary mb-1">Loading DentaMind AI</p>
      
      {/* Loading message that cycles with fade transition */}
      <div className="relative text-sm text-primary opacity-80 h-5 text-center min-w-[220px] overflow-hidden">
        {loadingMessages.map((message, index) => (
          <div 
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-in-out transform",
              index === currentMessage 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4"
            )}
          >
            {message}
          </div>
        ))}
      </div>
      
      {/* Loading progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-primary animate-loading-progress rounded-full"></div>
      </div>
    </div>
  );
}