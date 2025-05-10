import React from "react";
import DentaMindLogoImg from "./dental/DentaMindLogo";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DentaMindLogo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeMap = {
    sm: 40,
    md: 80,
    lg: 120,
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DentaMindLogoImg 
        width={sizeMap[size]} 
        height={sizeMap[size]}
        variant="icon" // Always use the green face/tooth icon
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