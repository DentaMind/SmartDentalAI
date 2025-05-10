import React, { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

// Circuit-style tooth icon as requested
export const CircuitToothIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = '#28C76F', size = 24, strokeWidth = 1.5, ...props }, ref) => {
    // Calculate stroke width for circuit elements
    const circuitStrokeWidth = typeof strokeWidth === 'number' ? strokeWidth * 0.8 : strokeWidth;
    
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
      >
        {/* Tooth outline with digital/circuit styling */}
        <path 
          d="M7,8 C5.5,8 4.5,9.5 4.5,11 C4.5,13 5.5,15 5.5,17 C5.5,18.5 6.5,19.5 8,19.5 C9,19.5 10,18 11.5,18 C13,18 14,19.5 15,19.5 C16.5,19.5 17.5,18.5 17.5,17 C17.5,15 18.5,13 18.5,11 C18.5,9.5 17.5,8 16,8 C14.5,8 13.5,9.5 11.5,9.5 C9.5,9.5 8.5,8 7,8 Z" 
          fill="rgba(0,0,0,0.15)" 
          stroke={color}
          strokeWidth={strokeWidth}
        />

        {/* Circuit paths */}
        <path
          d="M6,8.5 L6,6.5 L8,6.5 M8,6.5 L10,6.5 M10,6.5 L10,4.5 M14,6.5 L16,6.5 M16,6.5 L18,6.5 L18,8.5"
          fill="none"
          stroke={color}
          strokeWidth={circuitStrokeWidth}
        />

        {/* Additional circuits */}
        <path
          d="M4.5,11 L2.5,11 M19.5,11 L21.5,11"
          fill="none"
          stroke={color}
          strokeWidth={circuitStrokeWidth}
        />

        {/* Vertical circuits */}
        <path
          d="M8,19.5 L8,21.5 M16,19.5 L16,21.5"
          fill="none" 
          stroke={color}
          strokeWidth={circuitStrokeWidth}
        />

        {/* Connection points/nodes */}
        <circle cx="6" cy="8.5" r="0.5" fill={color} />
        <circle cx="8" cy="6.5" r="0.5" fill={color} />
        <circle cx="10" cy="6.5" r="0.5" fill={color} />
        <circle cx="10" cy="4.5" r="0.5" fill={color} />
        <circle cx="14" cy="6.5" r="0.5" fill={color} />
        <circle cx="16" cy="6.5" r="0.5" fill={color} />
        <circle cx="18" cy="8.5" r="0.5" fill={color} />
        <circle cx="4.5" cy="11" r="0.5" fill={color} />
        <circle cx="19.5" cy="11" r="0.5" fill={color} />
        <circle cx="8" cy="19.5" r="0.5" fill={color} />
        <circle cx="16" cy="19.5" r="0.5" fill={color} />
        <circle cx="8" cy="21.5" r="0.5" fill={color} />
        <circle cx="16" cy="21.5" r="0.5" fill={color} />
        <circle cx="2.5" cy="11" r="0.5" fill={color} />
        <circle cx="21.5" cy="11" r="0.5" fill={color} />

        {/* Inside circuit paths */}
        <path
          d="M7,12 L11.5,12 L11.5,16 L15,16 L15,14"
          fill="none"
          stroke={color}
          strokeWidth={circuitStrokeWidth}
        />

        {/* Additional nodes */}
        <circle cx="7" cy="12" r="0.5" fill={color} />
        <circle cx="11.5" cy="12" r="0.5" fill={color} />
        <circle cx="11.5" cy="16" r="0.5" fill={color} />
        <circle cx="15" cy="16" r="0.5" fill={color} />
        <circle cx="15" cy="14" r="0.5" fill={color} />
      </svg>
    );
  }
);

CircuitToothIcon.displayName = 'CircuitToothIcon';