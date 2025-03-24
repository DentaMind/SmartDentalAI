import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// Import the DentaMind logo
import dentaMindLogo from "../../assets/dentamind-logo.png";

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
      <h1 className="text-2xl font-bold text-green-600 mb-4">DentaMind AI</h1>
      
      {/* Single DentaMind logo with simpler animation */}
      <div className="relative h-32 w-32 mb-6">
        {/* Background glow effect */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse"></div>
        
        {/* Logo - static, no swinging */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
          zIndex: 10
        }}>
          <img 
            src={dentaMindLogo} 
            alt="DentaMind Logo" 
            style={{ 
              width: '110px', 
              height: '110px', 
              backgroundColor: 'rgba(255, 255, 255, 0.25)', 
              borderRadius: '50%', 
              padding: '8px',
              boxShadow: '0 0 15px rgba(40, 199, 111, 0.6)'
            }}
          />
        </div>
      </div>
      
      {/* Loading text with DentaMind branding */}
      <p className="text-lg font-medium text-green-700 mb-1">Loading DentaMind AI</p>
      
      {/* Loading message that cycles with fade transition */}
      <div className="relative text-sm text-green-600 opacity-80 h-5 text-center min-w-[220px] overflow-hidden">
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
        <div className="h-full bg-green-500 animate-loading-progress rounded-full"></div>
      </div>
    </div>
  );
}