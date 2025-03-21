import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from 'lucide-react';

interface PatientNameButtonProps {
  patientId: number;
  patientName: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'link' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * A reusable component that renders a patient's name as a button 
 * that navigates to their profile when clicked
 */
export function PatientNameButton({
  patientId,
  patientName,
  className = '',
  showIcon = true,
  variant = 'link',
  size = 'default'
}: PatientNameButtonProps) {
  const [, navigate] = useLocation();
  
  // Navigate to patient profile
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/patients/${patientId}`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={handleClick} 
            variant={variant}
            size={size}
            className={`font-medium ${className}`}
          >
            {showIcon && <User className="h-3.5 w-3.5 mr-1 opacity-70" />}
            {patientName}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View patient profile</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}