
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrthodonticAnalyzer } from "@/components/orthodontic/orthodontic-analyzer";
import { usePatient, Patient } from "@/hooks/use-patient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Calendar, ChevronRight, Cog, Ruler, Box, User } from "lucide-react";

export default function OrthodonticDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("analyze");
  const { patients, loading } = usePatient();
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalysisComplete = (analysisData: any) => {
    setAnalysis(analysisData);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Orthodontic AI Hub"
        text="Comprehensive orthodontic analysis, treatment planning, and simulation tools"
      >
        <Select 
          value={selectedPatientId?.toString()} 
          onValueChange={(value) => setSelectedPatientId(Number(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Patient" />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>Loading patients...</SelectItem>
            ) : (
              patients?.map((patient: Patient) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </DashboardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="analyze">
            <BrainCircuit className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="3d" disabled={!analysis}>
            <Box className="h-4 w-4 mr-2" />
            3D Simulation
          </TabsTrigger>
          <TabsTrigger value="treatment" disabled={!analysis}>
            <Calendar className="h-4 w-4 mr-2" />
            Treatment
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Ruler className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <OrthodonticAnalyzer 
            patientId={selectedPatientId} 
            onAnalysisComplete={handleAnalysisComplete}
          />
        </TabsContent>

        <TabsContent value="3d" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                3D Treatment Simulation
              </CardTitle>
              <CardDescription>
                AI-powered visualization of expected treatment outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-md flex items-center justify-center bg-muted border">
                <div className="text-center space-y-3">
                  <Box className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium">3D Simulation</p>
                    <p className="text-sm text-muted-foreground">
                      Select a treatment option to visualize the expected outcome over time
                    </p>
                    <Button variant="outline" className="mt-4">
                      Generate Simulation
                    </Button>
                  </div>
                </div>
              </div>
              
              {analysis && (
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {analysis.treatmentOptions.map((option: any, i: number) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{option.option}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-xs text-muted-foreground">
                          Duration: {option.duration}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button size="sm" variant="outline">Select</Button>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-6">
          {analysis ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Treatment Plan
                  </CardTitle>
                  <CardDescription>
                    AI-recommended treatment based on analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Recommended Approach</h3>
                    <p className="text-sm">{analysis.treatmentOptions[0].option}</p>
                    <p className="text-sm text-muted-foreground mt-1">Expected duration: {analysis.treatmentOptions[0].duration}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Treatment Phases</h3>
                    <div className="space-y-2">
                      <div className="p-2 rounded border">
                        <div className="flex justify-between">
                          <p className="font-medium">Initial Phase</p>
                          <p className="text-sm text-muted-foreground">1-3 months</p>
                        </div>
                        <p className="text-sm">Alignment and leveling</p>
                      </div>
                      <div className="p-2 rounded border">
                        <div className="flex justify-between">
                          <p className="font-medium">Intermediate Phase</p>
                          <p className="text-sm text-muted-foreground">4-12 months</p>
                        </div>
                        <p className="text-sm">Space closure and correction</p>
                      </div>
                      <div className="p-2 rounded border">
                        <div className="flex justify-between">
                          <p className="font-medium">Final Phase</p>
                          <p className="text-sm text-muted-foreground">13-24 months</p>
                        </div>
                        <p className="text-sm">Finishing and detailing</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Appointment Schedule</h3>
                    <div className="text-sm">
                      <p>Initial bonding: Schedule 90-minute appointment</p>
                      <p>Adjustments: Every 4-6 weeks (30 minutes)</p>
                      <p>Progress evaluation: Every 6 months</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Generate Detailed Plan</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="h-5 w-5 text-primary" />
                    Treatment Customization
                  </CardTitle>
                  <CardDescription>
                    Fine-tune treatment parameters and goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Treatment Goals</h3>
                    <div className="grid gap-2">
                      {["Correct Class II relationship", "Reduce overjet", "Align arches", "Correct midlines"].map((goal, i) => (
                        <div key={i} className="flex items-center">
                          <input type="checkbox" id={`goal-${i}`} className="mr-2" defaultChecked />
                          <label htmlFor={`goal-${i}`} className="text-sm">{goal}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Treatment Parameters</h3>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Treatment Aggressiveness</p>
                          <Select defaultValue="moderate">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conservative">Conservative</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="aggressive">Aggressive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Extraction Pattern</p>
                          <Select defaultValue="non-extraction">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non-extraction">Non-extraction</SelectItem>
                              <SelectItem value="bicuspid">Bicuspid extraction</SelectItem>
                              <SelectItem value="asymmetric">Asymmetric extraction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Patient Considerations</h3>
                    <div className="grid gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Compliance Level</p>
                        <Select defaultValue="moderate">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Aesthetic Preferences</p>
                        <Select defaultValue="clear">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clear">Clear aligners preferred</SelectItem>
                            <SelectItem value="ceramic">Ceramic brackets acceptable</SelectItem>
                            <SelectItem value="metal">No aesthetic concerns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Update Treatment Plan</Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <User className="h-20 w-20 text-muted-foreground/30 mx-auto" />
                <h3 className="text-xl font-medium mt-4">No Analysis Available</h3>
                <p className="text-muted-foreground">
                  Complete the orthodontic analysis first to generate a treatment plan
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab("analyze")}
                >
                  Go to Analysis
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                Treatment Monitoring
              </CardTitle>
              <CardDescription>
                Track treatment progress and compare to predicted outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-md flex items-center justify-center bg-muted border">
                <div className="text-center space-y-3">
                  <Ruler className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium">Progress Monitoring</p>
                    <p className="text-sm text-muted-foreground">
                      Upload progress photos and scans to track treatment progress
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline">Upload Photos</Button>
                      <Button variant="outline">Upload Scan</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
