
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerioChart } from "@/components/perio/perio-chart";
import { LineChart, Scissors, History, BarChart4 } from "lucide-react";

export default function PerioDashboardPage() {
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState("chart");
  
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
            <LineChart className="h-7 w-7 text-primary" />
            <span>Periodontal Assessment</span>
          </div>
        }
        description={`${patient.firstName} ${patient.lastName} - Periodontal examination and risk assessment`}
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart">
              <LineChart className="w-4 h-4 mr-2" />
              Perio Chart
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="treatment">
              <Scissors className="w-4 h-4 mr-2" />
              Treatment
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <BarChart4 className="w-4 h-4 mr-2" />
              AI Analysis
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="chart">
              <PerioChart />
            </TabsContent>
            
            <TabsContent value="history">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Periodontal History</h3>
                <p>Historical perio measurements section will be implemented here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="treatment">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Periodontal Treatment Planning</h3>
                <p>Treatment planning section will be implemented here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">AI-Powered Periodontal Analysis</h3>
                <p>AI analysis section will be implemented here.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
