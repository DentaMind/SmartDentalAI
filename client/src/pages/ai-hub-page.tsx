import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AIHubDashboard } from '@/components/ai-hub/ai-hub-dashboard';
import { usePatient } from '@/hooks/use-patient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIHubPage() {
  const [location, setLocation] = useLocation();
  const { patientId } = useParams<{ patientId?: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // In a real app, you would:
  // 1. Fetch the selected patient data
  // 2. Fetch provider details from user context
  // This is mocked for demonstration
  
  const selectedPatientId = patientId ? parseInt(patientId) : undefined;
  
  // Mock patient data
  const mockPatients = [
    { id: 1, name: 'John Doe', age: 45, imageUrl: '' },
    { id: 2, name: 'Sarah Johnson', age: 38, imageUrl: '' },
    { id: 3, name: 'Michael Williams', age: 52, imageUrl: '' }
  ];
  
  const selectedPatient = selectedPatientId 
    ? mockPatients.find(p => p.id === selectedPatientId)
    : undefined;
  
  const handleGenerateTreatmentPlan = async (planData: any) => {
    toast({
      title: "Treatment Plan Generated",
      description: `Treatment plan for ${selectedPatient?.name} has been saved.`,
      variant: "default",
    });
  };
  
  const handleSearchPatient = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // In a real app, this would redirect to the selected patient's AI Hub
      setLocation('/ai-hub/2');
    }, 1500);
  };
  
  const handleRequestXRays = () => {
    toast({
      title: "X-Ray Capture Requested",
      description: "Please capture new X-rays for the patient.",
      variant: "default",
    });
  };
  
  const handleRequestPerioChart = () => {
    toast({
      title: "Perio Chart Update Requested",
      description: "Please update the periodontal chart for the patient.",
      variant: "default",
    });
  };
  
  // Render patient selection screen if no patient is selected
  if (!selectedPatient) {
    return (
      <div className="container py-10 space-y-6">
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-6">DentaMind AI Hub</h1>
          <p className="text-muted-foreground mb-10">
            Select a patient to generate AI-powered diagnosis and treatment planning
          </p>
          
          <div className="w-full flex mb-8">
            <Input
              placeholder="Search for a patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSearchPatient}
              disabled={loading}
              className="ml-2"
            >
              {loading ? 
                "Searching..." :
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              }
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {mockPatients.map(patient => (
              <Card 
                key={patient.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setLocation(`/ai-hub/${patient.id}`)}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{patient.name}</CardTitle>
                    <CardDescription>Age {patient.age}</CardDescription>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to run AI diagnosis and treatment planning
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {loading && (
              <>
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mt-2" />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mt-2" />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render AI Hub dashboard for selected patient
  return (
    <div className="container py-6 space-y-6">
      <AIHubDashboard
        patientId={selectedPatient.id}
        doctorId={user?.id}
        patientName={selectedPatient.name}
        doctorName={user?.firstName ? `Dr. ${user.firstName} ${user.lastName}` : "Dr. Smith"}
        onGenerateTreatmentPlan={handleGenerateTreatmentPlan}
        onRequestXRays={handleRequestXRays}
        onRequestPerioChart={handleRequestPerioChart}
      />
    </div>
  );
}