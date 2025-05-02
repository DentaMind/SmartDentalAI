import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { ClinicalNotes } from '../../components/patient/ClinicalNotes';

// Import other patient components as needed
// import { PatientHeader } from '../../components/patient/PatientHeader';
// import { PatientChart } from '../../components/patient/PatientChart';
// import { PatientTreatmentPlans } from '../../components/patient/PatientTreatmentPlans';
// import { PatientPrescriptions } from '../../components/patient/PatientPrescriptions';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  // Add other patient fields as needed
}

export default function PatientDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    setIsLoading(true);
    try {
      // Fetch patient data from API
      const response = await fetch(`/api/patients/${id}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      
      const data = await response.json();
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading patient information...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Patient Not Found</h1>
        <p>The requested patient could not be found.</p>
        <Button onClick={() => router.push('/patients')} className="mt-4">
          Return to Patient List
        </Button>
      </div>
    );
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Patient header with basic info */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow">
        {/* <PatientHeader patient={patient} /> */}
        <h1 className="text-3xl font-bold">{patientName}</h1>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p>{new Date(patient.date_of_birth).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p>{patient.gender}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact</p>
            <p>{patient.email}</p>
            <p>{patient.phone}</p>
          </div>
        </div>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="notes">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="images">Imaging</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* <PatientChart patientId={patient.id} /> */}
              <p>Dental Chart component will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treatment" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* <PatientTreatmentPlans patientId={patient.id} /> */}
              <p>Treatment Plans component will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ClinicalNotes patientId={patient.id} patientName={patientName} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prescriptions" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* <PatientPrescriptions patientId={patient.id} patientName={patientName} /> */}
              <p>Prescriptions component will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="images" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p>Imaging component will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 