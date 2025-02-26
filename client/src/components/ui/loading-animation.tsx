import { useState, useEffect } from "react";
import { Syringe, Stethoscope, Microscope, ThermometerSun } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  className?: string;
}

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const tools = [
    { icon: Stethoscope, color: "text-primary" },
    { icon: Syringe, color: "text-blue-500" },
    { icon: Microscope, color: "text-green-500" },
    { icon: ThermometerSun, color: "text-orange-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % tools.length);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative h-12 w-12", className)}>
      {tools.map((Tool, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-300 transform",
              Tool.color,
              isActive
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-75 rotate-90"
            )}
          >
            <Tool.icon className="h-12 w-12 animate-pulse" />
          </div>
        );
      })}
    </div>
  );
}
