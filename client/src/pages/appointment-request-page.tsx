import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppointmentRequestForm } from '@/components/appointments/appointment-request-form';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function AppointmentRequestPage() {
  const { user } = useAuth();
  
  // Check if user is a patient
  const isPatient = user?.role === 'patient';
  
  // Fetch patient profile to ensure we have their information
  const { data: patientProfile, isLoading, error } = useQuery({
    queryKey: ['/api/patients/profile'],
    queryFn: () => apiRequest('/api/patients/profile'),
    enabled: isPatient,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Request an Appointment</h1>
          <p className="text-gray-600 mt-2">
            Complete the form below to request an appointment with one of our dental professionals.
          </p>
        </header>
        
        {!isPatient && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Only patients can request appointments. Please contact the clinic directly to schedule an appointment.
            </AlertDescription>
          </Alert>
        )}
        
        {isPatient && isLoading && (
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        
        {isPatient && error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription>
              We couldn't load your patient profile. Please try again later or contact the clinic.
            </AlertDescription>
          </Alert>
        )}
        
        {isPatient && patientProfile && (
          <AppointmentRequestForm />
        )}
      </div>
    </div>
  );
}