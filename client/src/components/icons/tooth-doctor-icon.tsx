import React, { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

// Define ToothDoctorIcon as a forwardRef component to be compatible with Lucide icons
export const ToothDoctorIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = 'currentColor', size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {/* Elegant molar tooth shape */}
        <path 
          d="M7,8.5 C5.5,8.5 5,10 5,11.5 C5,13.5 6,15.5 6,17.5 C6,19 7,20 8.5,20 C9.5,20 10.5,18.5 12,18.5 C13.5,18.5 14.5,20 15.5,20 C17,20 18,19 18,17.5 C18,15.5 19,13.5 19,11.5 C19,10 18.5,8.5 17,8.5 C15.5,8.5 14.5,10 12,10 C9.5,10 8.5,8.5 7,8.5 Z" 
          fill={color} 
          stroke={color}
          strokeWidth="1"
          opacity="0.85"
        />

        {/* Small dental mirror */}
        <circle 
          cx="17.5" 
          cy="7" 
          r="1.5" 
          fill="white" 
          stroke={color} 
          strokeWidth="0.75"
        />
        <line 
          x1="17.5" 
          y1="8.5" 
          x2="16.5" 
          y2="11" 
          stroke={color} 
          strokeWidth="0.75"
        />

        {/* Professional elements */}
        <path 
          d="M8,5.5 C8,3.5 9.8,2 12,2 C14.2,2 16,3.5 16,5.5 C16,7.5 14.2,9 12,9 C9.8,9 8,7.5 8,5.5 Z" 
          fill="white" 
          stroke={color} 
          strokeWidth="0.75"
        />
        
        {/* Dental lab coat details */}
        <path 
          d="M9,7 L8,10 L9,14 L15,14 L16,10 L15,7" 
          stroke={color}
          strokeWidth="0.75"
          fill="white"
        />

        {/* Stethoscope or dental explorer tool */}
        <path 
          d="M7.5,10.5 C6,11.5 5.5,13 7,14 C8,14.5 9,14 10,13" 
          fill="none" 
          stroke={color}
          strokeWidth="0.75"
        />
        <circle cx="7" cy="14" r="0.5" fill={color} />

        {/* Smile indication */}
        <path
          d="M10.5,6 C11,6.5 11.5,6.75 12,6.75 C12.5,6.75 13,6.5 13.5,6"
          stroke={color}
          strokeWidth="0.75"
          fill="none"
        />

        {/* Glasses or professional eye details */}
        <path
          d="M10,4.5 C10.5,4.5 11,5 11,5 M13,5 C13,5 13.5,4.5 14,4.5"
          stroke={color}
          strokeWidth="0.5"
          fill="none"
        />
      </svg>
    );
  }
);

ToothDoctorIcon.displayName = 'ToothDoctorIcon';