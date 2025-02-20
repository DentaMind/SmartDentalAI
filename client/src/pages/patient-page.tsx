import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Patient, TreatmentPlan } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AIDiagnosis from "@/components/ai-diagnosis";
import TreatmentPlanComponent from "@/components/treatment-plan";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AppointmentScheduler from "@/components/appointment-scheduler";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading: loadingPatient } = useQuery<Patient>({
    queryKey: ["/api/patients", parseInt(id)],
  });

  const { data: treatmentPlans, isLoading: loadingPlans } = useQuery<
    TreatmentPlan[]
  >({
    queryKey: ["/api/treatment-plans", parseInt(id)],
  });

  if (loadingPatient || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {patient.firstName} {patient.lastName}
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Schedule Appointment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <AppointmentScheduler
              patientId={patient.id}
              onSuccess={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                <dd>
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd>{patient.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd>{patient.phone}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(patient.medicalHistory, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="diagnosis">
        <TabsList>
          <TabsTrigger value="diagnosis">AI Diagnosis</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="diagnosis" className="mt-6">
          <AIDiagnosis patientId={patient.id} />
        </TabsContent>
        <TabsContent value="treatment" className="mt-6">
          <TreatmentPlanComponent
            patientId={patient.id}
            existingPlans={treatmentPlans || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
