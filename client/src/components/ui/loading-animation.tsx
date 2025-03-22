import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// Import the DentaMind logo
import dentaMindLogo from "../../assets/dentamind-logo.png";

interface LoadingAnimationProps {
  className?: string;
}

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  const [visible, setVisible] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([
    "Analyzing patient data...",
    "Loading AI models...",
    "Preparing dashboard...",
    "Optimizing diagnostics...",
    "Syncing dental records..."
  ]);
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // Only show loading after 300ms delay
    const timer = setTimeout(() => setVisible(true), 300);

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((current) => (current + 1) % loadingMessages.length);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(messageInterval);
    };
  }, [loadingMessages.length]);

  if (!visible) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* DentaMind logo with swinging animation */}
      <div className="relative h-40 w-40 mb-6">
        {/* Background glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse"></div>
        <div className="absolute inset-0 rounded-full bg-cyan-400/5 blur-lg animate-pulse" 
             style={{ animationDelay: '300ms' }}></div>
        
        {/* Logo with swinging animation */}
        <div className="absolute inset-0 animate-swing origin-top">
          <img 
            src={dentaMindLogo} 
            alt="DentaMind Logo" 
            className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
          />
        </div>
        
        {/* Orbit effect around the logo */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-orbit opacity-70" 
              style={{ top: '5%', left: '50%', animationDelay: '0ms' }}></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 animate-orbit opacity-70" 
              style={{ top: '25%', left: '75%', animationDelay: '250ms' }}></div>
          <div className="absolute w-1 h-1 rounded-full bg-teal-400 animate-orbit opacity-70" 
              style={{ top: '65%', left: '85%', animationDelay: '500ms' }}></div>
        </div>
      </div>
      
      {/* Loading message that cycles with fade transition */}
      <div className="relative text-sm text-blue-300 opacity-80 h-5 text-center min-w-[220px] overflow-hidden">
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
    </div>
  );
}