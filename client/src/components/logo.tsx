import React from "react";
import dentaMindLogo from "../assets/dentamind-logo-new.jpg"; // Use the new logo

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DentaMindLogo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeMap = {
    sm: "h-10 w-auto",
    md: "h-14 w-auto",
    lg: "h-20 w-auto",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={dentaMindLogo} 
        alt="DentaMind Logo" 
        className={`${sizeMap[size]} object-contain animate-pulse-subtle rounded-full`}
      />
      {showText && (
        <div className="ml-3">
          <span className="font-bold text-xl tracking-wider bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">DentaMind</span>
          <span className="block text-sm text-gray-500 font-medium">AI-Powered Dental Excellence</span>
        </div>
      )}
    </div>
  );
}