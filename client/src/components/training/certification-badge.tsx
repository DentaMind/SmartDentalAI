import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CertificationTypeEnum } from 'shared/schema';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

type CertificationStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';

interface CertificationBadgeProps {
  certType: CertificationTypeEnum;
  status: CertificationStatus;
  progress?: number;
  expiresAt?: string | Date | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Certification badge component for displaying user's certification status
 * Used in scheduler, staff directory, and profile pages
 */
export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certType,
  status,
  progress = 0,
  expiresAt,
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  // Define certification type labels and colors
  const certTypeInfo = {
    hipaa: { label: 'HIPAA', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    osha: { label: 'OSHA', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    ada: { label: 'ADA', color: 'bg-green-100 text-green-800 border-green-300' },
    cpr: { label: 'CPR', color: 'bg-red-100 text-red-800 border-red-300' },
    infection_control: { label: 'Infection', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    emergency_protocols: { label: 'Emergency', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    custom: { label: 'Training', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  };

  // Set badge styles based on certification status
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'border-2 border-green-500';
      case 'in_progress': 
        return 'border-2 border-yellow-500';
      case 'expired':
        return 'border-2 border-red-500';
      case 'not_started':
      default:
        return 'border-2 border-gray-300';
    }
  };

  // Get status icon based on certification status
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
    
    switch (status) {
      case 'completed':
        return <CheckCircle size={iconSize} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={iconSize} className="text-yellow-500" />;
      case 'expired':
        return <AlertCircle size={iconSize} className="text-red-500" />;
      case 'not_started':
      default:
        return <XCircle size={iconSize} className="text-gray-500" />;
    }
  };

  // Format the expiration date
  const formatExpirationDate = () => {
    if (!expiresAt) return 'No expiration date';
    
    const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    return date.toLocaleDateString();
  };

  // Check if certification is about to expire (within 30 days)
  const isNearExpiration = () => {
    if (!expiresAt) return false;
    
    const today = new Date();
    const expDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  // Get tooltip content based on certification status
  const getTooltipContent = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="text-center">
            <div className="font-bold mb-1">{certTypeInfo[certType].label} Certified</div>
            {expiresAt && (
              <div className={`text-xs ${isNearExpiration() ? 'text-amber-500 font-bold' : ''}`}>
                Expires: {formatExpirationDate()}
                {isNearExpiration() && <div className="mt-1 text-amber-500">Expiring soon!</div>}
              </div>
            )}
          </div>
        );
      case 'in_progress':
        return (
          <div className="text-center">
            <div className="font-bold mb-1">{certTypeInfo[certType].label} In Progress</div>
            <div className="text-xs">Progress: {progress}%</div>
          </div>
        );
      case 'expired':
        return (
          <div className="text-center">
            <div className="font-bold mb-1">{certTypeInfo[certType].label} Expired</div>
            <div className="text-xs">Expired: {formatExpirationDate()}</div>
            <div className="text-xs font-bold text-red-500 mt-1">Renewal required</div>
          </div>
        );
      case 'not_started':
      default:
        return (
          <div className="text-center">
            <div className="font-bold mb-1">{certTypeInfo[certType].label} Not Started</div>
            <div className="text-xs">Certification required</div>
          </div>
        );
    }
  };

  // Determine sizing
  const sizingClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`
              ${certTypeInfo[certType].color}
              ${getStatusStyles()}
              ${sizingClasses[size]}
              flex items-center gap-1.5 rounded-full whitespace-nowrap
              ${className}
            `}
          >
            {getStatusIcon()}
            {showLabel && certTypeInfo[certType].label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Certification status display component that shows all certifications for a provider
 */
export const CertificationStatusGroup: React.FC<{
  certifications: Array<{
    moduleType: CertificationTypeEnum;
    status: CertificationStatus;
    progress?: number;
    expiresAt?: string | null;
  }>;
  showAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ certifications, showAll = false, size = 'sm' }) => {
  // Sort certifications to show important ones first (expired, in progress)
  const sortedCertifications = [...certifications].sort((a, b) => {
    // Priority: expired > in_progress > not_started > completed
    const statusOrder = {
      expired: 0,
      in_progress: 1,
      not_started: 2,
      completed: 3
    };
    
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Only show the first 3 certifications unless showAll is true
  const displayCertifications = showAll 
    ? sortedCertifications 
    : sortedCertifications.slice(0, 3);

  // Count of hidden certifications
  const hiddenCount = sortedCertifications.length - displayCertifications.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayCertifications.map((cert, index) => (
        <CertificationBadge
          key={`${cert.moduleType}-${index}`}
          certType={cert.moduleType}
          status={cert.status}
          progress={cert.progress}
          expiresAt={cert.expiresAt || undefined}
          showLabel={true}
          size={size}
        />
      ))}
      
      {!showAll && hiddenCount > 0 && (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};