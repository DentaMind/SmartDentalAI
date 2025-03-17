import React from "react";
import dentaMindLogo from "../assets/dentamind-logo.png";

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
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && (
        <div className="ml-3">
          <span className="font-bold text-cyan-500 text-xl tracking-wider">DentaMind</span>
          <span className="block text-sm text-gray-500 font-medium">Advanced Dental Intelligence</span>
        </div>
      )}
    </div>
  );
}