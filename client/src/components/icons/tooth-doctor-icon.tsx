import React from 'react';

interface ToothDoctorIconProps extends React.SVGProps<SVGSVGElement> {}

export function ToothDoctorIcon(props: ToothDoctorIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Tooth shaped like a molar */}
      <path 
        d="M8,8 C6,8 6,10 6,11 C6,13 7,15 7,17 C7,19 8,20 9,20 C10,20 11,18 12,18 C13,18 14,20 15,20 C16,20 17,19 17,17 C17,15 18,13 18,11 C18,10 18,8 16,8 C14,8 13,10 12,10 C11,10 10,8 8,8 Z" 
        fill="currentColor" 
        stroke="currentColor"
        strokeWidth="1"
      />

      {/* Doctor's face */}
      <circle cx="12" cy="7" r="2.5" fill="currentColor" />
      
      {/* Doctor's white coat/lab coat */}
      <path 
        d="M9,9 L8,14 L9,18 L15,18 L16,14 L15,9 Z" 
        fill="white" 
        stroke="currentColor"
        strokeWidth="0.75"
      />
      
      {/* Stethoscope */}
      <path 
        d="M7,11 C5,12 4,14 6,15 C7,15.5 9,15 10,14" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="6" cy="15" r="0.75" fill="currentColor" />
    </svg>
  );
}