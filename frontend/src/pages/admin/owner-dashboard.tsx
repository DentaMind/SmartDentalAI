import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { OwnerDashboard } from '../../components/admin/OwnerDashboard';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is Dr. Abdin
    const checkAuthorization = async () => {
      try {
        // Get current user info
        const response = await fetch('/api/auth/current-user');
        if (!response.ok) throw new Error('Failed to get user info');
        
        const userData = await response.json();
        
        // Check if this is Dr. Abdin
        if (userData.username === 'dr.abdin') {
          setIsAuthorized(true);
        } else {
          // Not authorized, redirect after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        
        // Handle failed auth check - redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Verifying credentials...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This dashboard is restricted to DentaMind owners only. You will be redirected to the main dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <OwnerDashboard />
    </div>
  );
} 