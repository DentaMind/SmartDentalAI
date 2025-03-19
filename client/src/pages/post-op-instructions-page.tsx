import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PostOpInstructions } from "@/components/patients/post-op-instructions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Patient } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function PostOpInstructionsPage() {
  const { user } = useAuth();

  // Fetch patient profile for the logged-in patient user
  const { data: patientProfile, isLoading: patientLoading } = useQuery({
    queryKey: ['/api/patients/profile'],
    queryFn: () => apiRequest<Patient>('/api/patients/profile'),
    enabled: user?.role === 'patient',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (patientLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patientProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Post-Operative Instructions</CardTitle>
          <CardDescription>
            Information about your recent dental procedures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Patient profile not found. Please contact the clinic for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post-Operative Instructions</h1>
      <PostOpInstructions 
        patientId={patientProfile.id} 
        patientName={`${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`} 
      />
    </div>
  );
}