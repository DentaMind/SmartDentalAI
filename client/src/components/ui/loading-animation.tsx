import { useState, useEffect } from "react";
import { Stethoscope, BrainCircuit, ScanFace, ZoomIn, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  className?: string;
}

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([
    "Analyzing patient data...",
    "Loading AI models...",
    "Preparing dashboard...",
    "Optimizing diagnostics...",
    "Syncing dental records..."
  ]);
  const [currentMessage, setCurrentMessage] = useState(0);

  // More AI/dental tech-focused icons
  const tools = [
    { icon: BrainCircuit, color: "text-blue-400" },
    { icon: ScanFace, color: "text-cyan-400" },
    { icon: Stethoscope, color: "text-indigo-400" },
    { icon: ZoomIn, color: "text-purple-400" },
    { icon: Sparkles, color: "text-sky-400" },
  ];

  useEffect(() => {
    // Only show loading after 300ms delay (reduced from 500ms for better UX)
    const timer = setTimeout(() => setVisible(true), 300);

    // Icon rotation animation
    const iconInterval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % tools.length);
    }, 800); // Slowed down slightly for better visibility

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((current) => (current + 1) % loadingMessages.length);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(iconInterval);
      clearInterval(messageInterval);
    };
  }, [loadingMessages.length]);

  if (!visible) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* AI icon animation with glowing effect */}
      <div className="relative h-16 w-16 mb-2">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse"></div>
        
        {/* Icon animations */}
        {tools.map((Tool, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-all duration-500 transform",
                Tool.color,
                isActive
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-75 rotate-90"
              )}
            >
              <Tool.icon className="h-16 w-16 stroke-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              
              {/* Orbit effect */}
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-full">
                  <div className="absolute w-2 h-2 rounded-full bg-blue-400 animate-orbit opacity-70" 
                       style={{ top: '0%', left: '50%', animationDelay: '0ms' }}></div>
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-orbit opacity-70" 
                       style={{ top: '25%', left: '100%', animationDelay: '250ms' }}></div>
                  <div className="absolute w-1 h-1 rounded-full bg-indigo-400 animate-orbit opacity-70" 
                       style={{ top: '75%', left: '100%', animationDelay: '500ms' }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Loading message that cycles */}
      <div className="text-sm text-blue-300 opacity-80 h-5 text-center min-w-[180px]">
        {loadingMessages[currentMessage]}
      </div>
    </div>
  );
}