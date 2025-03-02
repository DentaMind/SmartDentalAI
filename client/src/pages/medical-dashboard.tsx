
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MedicalHistoryPanel } from "@/components/medical/medical-history-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, User, AlertCircle, Pill } from "lucide-react";

export default function MedicalDashboardPage() {
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patients/${patientId}`);
      return res.json();
    },
    enabled: !!patientId
  });

  if (isLoading || !patient) {
    return <div className="container py-10">Loading patient information...</div>;
  }

  return (
    <div className="container py-8">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span>Patient Medical Profile</span>
          </div>
        }
        description={`${patient.firstName} ${patient.lastName} - Medical history and analysis`}
        actions={
          <div className="flex items-center gap-2">
            {/* Additional action buttons can go here */}
          </div>
        }
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <User className="w-4 h-4 mr-2" />
              Medical Overview
            </TabsTrigger>
            <TabsTrigger value="medications">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertCircle className="w-4 h-4 mr-2" />
              Risk Factors
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="overview">
              <MedicalHistoryPanel patientId={Number(patientId)} />
            </TabsContent>
            
            <TabsContent value="medications">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Medication Management</h3>
                <p>Medications section will be implemented here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="alerts">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Risk Factor Analysis</h3>
                <p>Medical risk factors section will be implemented here.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
