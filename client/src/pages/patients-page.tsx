import React, { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  insuranceProvider?: string;
}

interface Patient {
  id: number;
  userId: number;
  user: User;
  allergies?: string;
  medicalHistory?: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [_, navigate] = useLocation();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log("Attempting to fetch from /patients");
        const res = await fetch('/patients');
        const data = await res.json();
        console.log("SUCCESS: Patient data received:", data);
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

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
        <h1 className="text-2xl font-bold mb-6">Patient List</h1>
        
        {patients.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p>No patients found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((p) => {
              let allergies: string[] = [];
              let conditions: string[] = [];

              try {
                if (p.allergies) allergies = JSON.parse(p.allergies);
              } catch {}

              try {
                const parsed = p.medicalHistory ? JSON.parse(p.medicalHistory) : {};
                conditions = parsed.systemicConditions || [];
              } catch {}

              return (
                <Card key={p.id} className="p-4 shadow-md">
                  <h2 className="text-lg font-semibold mb-2">
                    {p.user?.firstName || "Unknown"} {p.user?.lastName || ""}
                  </h2>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> {p.user?.email ?? 'N/A'}</p>
                    <p><strong>DOB:</strong> {p.user?.dateOfBirth ?? 'N/A'}</p>
                    <p><strong>Phone:</strong> {p.user?.phoneNumber ?? 'N/A'}</p>
                    <p><strong>Insurance:</strong> {p.user?.insuranceProvider ?? 'N/A'}</p>
                    <p><strong>Allergies:</strong> {allergies.join(', ') || 'None'}</p>
                    <p><strong>Conditions:</strong> {conditions.join(', ') || 'None'}</p>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => navigate(`/patients/${p.id}`)}
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
};

export default PatientsPage;