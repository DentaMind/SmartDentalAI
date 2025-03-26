import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/ui/loading-animation";

// Import the proper types from our shared types file
import { Patient as PatientType, User as UserType } from "@/types/patient-types";

// Extended interface for our component
interface User extends UserType {
  insuranceProvider?: string | null;
}

interface Patient extends PatientType {
  id: number;
  userId: number;
  user: User;
  allergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// Interface for parsed medical history
interface MedicalHistory {
  systemicConditions?: string[];
  medications?: string[];
  allergies?: string[];
  [key: string]: any;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [_, navigate] = useLocation();

  // Basic fetch for patients data
  useEffect(() => {
    fetch("/patients")
      .then(res => res.json())
      .then(data => {
        console.log("Patient data received:", data);
        setPatients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching patients:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Add debug log to confirm component rendering
  console.log("Rendering PatientsPage with", patients.length, "entries");

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <LoadingAnimation />
          <p className="ml-4">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-red-500">Error loading patients. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="ml-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Patients</h1>
        
        {patients.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p>No patients found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => {
              let medHistory: MedicalHistory = {};
              try {
                medHistory = patient.medicalHistory ? JSON.parse(patient.medicalHistory) : {};
              } catch (e) {
                console.error("Error parsing medical history", e);
              }

              // Format allergies - remove JSON formatting
              const allergiesFormatted = patient.allergies ? 
                patient.allergies.replace(/[\[\]"]/g, "").replace(/,/g, ", ") : 
                "None";

              return (
                <Card key={patient.id} className="p-4 shadow">
                  <h2 className="text-lg font-semibold mb-2">
                    {patient.user?.firstName ?? "First"} {patient.user?.lastName ?? "Last"}
                  </h2>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {patient.id}</p>
                    <p><strong>Email:</strong> {patient.user?.email ?? "N/A"}</p>
                    <p><strong>Phone:</strong> {patient.user?.phoneNumber ?? "N/A"}</p>
                    <p><strong>DOB:</strong> {patient.user?.dateOfBirth ?? "N/A"}</p>
                    <p><strong>Insurance:</strong> {patient.user.insuranceProvider ?? "N/A"}</p>
                    <p><strong>Allergies:</strong> {allergiesFormatted}</p>
                    <p>
                      <strong>Conditions:</strong>{" "}
                      {Array.isArray(medHistory.systemicConditions) ? 
                        medHistory.systemicConditions.join(", ") : "None"}
                    </p>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    View Profile
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}