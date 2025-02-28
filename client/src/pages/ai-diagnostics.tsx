import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Stethoscope, FileImage, Calculator, ClipboardList } from "lucide-react";
import { useState } from "react";

export default function AIDiagnosticsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("diagnosis");

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-primary/10">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Diagnostics</h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered dental analysis and treatment planning
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Diagnosis</span>
          </TabsTrigger>
          <TabsTrigger value="imaging" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span>Imaging</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Treatment</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Costs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              {/* We'll add the comprehensive diagnosis component here */}
              <p>Diagnosis system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle>X-Ray Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {/* We'll add the imaging analysis component here */}
              <p>Imaging analysis system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Planning</CardTitle>
            </CardHeader>
            <CardContent>
              {/* We'll add the treatment planning component here */}
              <p>Treatment planning system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {/* We'll add the cost analysis component here */}
              <p>Cost analysis system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
