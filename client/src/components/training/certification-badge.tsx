import { useState, useEffect } from 'react';
import { 
  Badge, 
  BadgeProps 
} from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from '@/lib/queryClient';

interface CertificationBadgeProps {
  userId: number;
  certificationType?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  showTooltip?: boolean;
  onClick?: () => void;
}

export function CertificationBadge({
  userId,
  certificationType = 'hipaa', // Default to HIPAA
  variant = 'default',
  showTooltip = true
}: CertificationBadgeProps) {
  const [status, setStatus] = useState<'loading' | 'certified' | 'incomplete' | 'expired'>('loading');
  const [tooltipText, setTooltipText] = useState('Checking certification status...');

  useEffect(() => {
    const checkCertification = async () => {
      try {
        // Call API to check certification status
        const response = await apiRequest<{
          certified: boolean;
          status: string;
          expiresAt?: string;
        }>(`/api/certifications/check/${userId}?type=${certificationType}`);

        if (response.certified) {
          setStatus('certified');
          
          // Check if there's an expiration date and it's soon (within 30 days)
          if (response.expiresAt) {
            const expiresDate = new Date(response.expiresAt);
            const daysUntilExpiry = Math.floor((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30) {
              setTooltipText(`${certificationType.toUpperCase()} certified (expires in ${daysUntilExpiry} days)`);
            } else {
              setTooltipText(`${certificationType.toUpperCase()} certified`);
            }
          } else {
            setTooltipText(`${certificationType.toUpperCase()} certified`);
          }
        } else if (response.status === 'expired') {
          setStatus('expired');
          setTooltipText(`${certificationType.toUpperCase()} certification expired`);
        } else {
          setStatus('incomplete');
          setTooltipText(`${certificationType.toUpperCase()} certification incomplete`);
        }
      } catch (error) {
        console.error('Error checking certification:', error);
        setStatus('incomplete');
        setTooltipText('Error checking certification status');
      }
    };

    checkCertification();
  }, [userId, certificationType]);

  // Determine badge properties based on status
  const getBadgeProps = (): BadgeProps => {
    switch (status) {
      case 'certified':
        return { variant: 'default', className: 'bg-green-600' };
      case 'expired':
        return { variant: 'outline', className: 'border-amber-500 text-amber-600' };
      case 'incomplete':
        return { variant: 'destructive' };
      case 'loading':
      default:
        return { variant: 'secondary' };
    }
  };

  const badgeProps = getBadgeProps();
  const badgeContent = status === 'loading' ? '...' : certificationType.toUpperCase();
  
  const badge = (
    <Badge {...badgeProps}>
      {badgeContent}
    </Badge>
  );

  // Return with or without tooltip based on prop
  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}