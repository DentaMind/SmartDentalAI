import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Plus, Eye, UserRound, Calendar, AlertCircle, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddPatientForm } from "@/components/patients/add-patient-form";
import { PatientDetails } from "@/components/patients/patient-details";
import { Patient } from "@/types/patient-types";

export default function PatientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients data
  const { data: patients, isLoading, isError } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Today's stats (placeholders for now)
  const todayAppointments = 5;
  const urgentCases = 2;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.firstName || "Doctor"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's your practice overview for today
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Patients
                </CardTitle>
                <UserRound className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total patients in your care
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled for today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50/50 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Urgent Cases
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{urgentCases}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Patient Management</h2>
              <p className="text-muted-foreground text-sm">
                View and manage your patients
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-sm">
                  <Plus className="h-5 w-5" />
                  {t("patient.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("patient.add")}</DialogTitle>
                </DialogHeader>
                <AddPatientForm onSuccess={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Patient Cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-4">
              <LoadingAnimation />
              <p className="text-gray-600">Loading patient data...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-gray-600">Error loading patients data. Please try again.</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="bg-card rounded-lg border shadow-sm p-8 text-center">
              <p className="text-lg text-muted-foreground">No patients found.</p>
              <p className="mt-2 text-sm text-muted-foreground">Click the "Add Patient" button to create your first patient record.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <span>
                        {patient.user?.firstName || 'First'} {patient.user?.lastName || 'Last'}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <span>{patient.user?.dateOfBirth || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="truncate max-w-[150px]">{patient.user?.phoneNumber || patient.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allergies:</span>
                        <span className="truncate max-w-[150px]">
                          {patient.allergies ? (
                            typeof patient.allergies === 'string' ? 
                              patient.allergies.replace(/[\[\]"]/g, "") : 
                              Array.isArray(patient.allergies) ? 
                                patient.allergies.join(', ') : 
                                'None'
                          ) : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medical History:</span>
                        <span className="truncate max-w-[150px]">
                          {patient.medicalHistory ? 'View details' : 'None recorded'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="w-full mt-4 gap-2"
                    >
                      <span>View Full Profile</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            isOpen={!!selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </main>
    </div>
  );
}