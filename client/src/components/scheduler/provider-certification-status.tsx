import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CertificationBadge, CertificationStatusGroup } from '../training/certification-badge';
import { CertificationType } from 'shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'wouter';

interface ProviderCertificationStatusProps {
  userId: number;
  name: string;
  role: string;
  compact?: boolean;
}

/**
 * Component for displaying provider's certification status
 * Used in scheduler to indicate whether providers are certified
 */
export const ProviderCertificationStatus: React.FC<ProviderCertificationStatusProps> = ({
  userId,
  name,
  role,
  compact = false
}) => {
  const navigate = useNavigate();
  const [showAllCertifications, setShowAllCertifications] = useState(false);
  
  // Fetch provider's certifications
  const { data: certifications, isLoading, isError } = useQuery({
    queryKey: ['/api/certifications/users', userId],
    queryFn: () => apiRequest(`/api/certifications/users/${userId}`),
    enabled: !!userId,
    // Don't refresh too often, certifications don't change frequently
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Determine if there are any expired or missing certifications
  const hasIssues = !!certifications?.some(
    cert => cert.status === 'expired' || cert.status === 'not_started'
  );
  
  // Compact view shown in scheduler
  if (compact) {
    if (isLoading) {
      return <div className="text-xs text-gray-500">Loading...</div>;
    }
    
    if (isError || !certifications || certifications.length === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-amber-500">
          <AlertTriangle size={14} />
          <span>Certification status unknown</span>
        </div>
      );
    }
    
    // Display certification badges in compact view
    return (
      <div className="mt-1">
        <CertificationStatusGroup 
          certifications={certifications.map(cert => ({
            moduleType: cert.module.moduleType as CertificationType,
            status: cert.status,
            progress: cert.progress,
            expiresAt: cert.expiresAt
          }))}
          size="sm"
        />
      </div>
    );
  }
  
  // Full view shown in staff directory or profile pages
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Certification Status</span>
          {hasIssues && (
            <span className="text-sm font-normal flex items-center gap-1.5 text-amber-500">
              <AlertTriangle size={16} />
              <span>Certification issues found</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading certification status...</div>
        ) : isError ? (
          <div className="py-4 text-center text-red-500">
            Error loading certification status
          </div>
        ) : certifications && certifications.length > 0 ? (
          <div className="space-y-3">
            <CertificationStatusGroup 
              certifications={certifications.map(cert => ({
                moduleType: cert.module.moduleType as CertificationType,
                status: cert.status,
                progress: cert.progress,
                expiresAt: cert.expiresAt
              }))}
              showAll={showAllCertifications}
              size="md"
            />
            
            {certifications.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAllCertifications(!showAllCertifications)}
              >
                {showAllCertifications ? 'Show less' : `Show all (${certifications.length})`}
              </Button>
            )}
            
            {hasIssues && (
              <Button 
                variant="secondary"
                className="w-full mt-2"
                onClick={() => navigate('/training')}
              >
                Review Training Requirements
              </Button>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-amber-500 flex flex-col items-center gap-2">
            <AlertTriangle size={24} />
            <div>No certifications found for this provider</div>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => navigate('/training')}
              className="mt-2"
            >
              Assign Training Modules
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};