import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Search, Bot, Teeth, BarChart3, FileImage, ChevronRight, Zap, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AIHub() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="DentaMind AI Hub"
        text="Comprehensive suite of AI-powered dental tools for diagnosis, treatment, and analysis"
      >
        <Button variant="default" onClick={() => navigateTo("/ai/new-analysis")}>
          <Brain className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </DashboardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="dashboard">
            <Brain className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="diagnostics">
            <Search className="h-4 w-4 mr-2" />
            AI Diagnostics
          </TabsTrigger>
          <TabsTrigger value="imaging">
            <FileImage className="h-4 w-4 mr-2" />
            Imaging AI
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-3 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center">
                  <Brain className="h-6 w-6 mr-2 text-primary" />
                  DentaMind AI Suite
                </CardTitle>
                <CardDescription className="text-base">
                  AI-powered tools to revolutionize your dental practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Our comprehensive AI system combines specialized dental domains to provide unprecedented 
                  diagnostic capabilities, treatment planning efficiency, and patient communication tools.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="bg-white/50">
                    Diagnostic AI
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    Imaging Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    Treatment Planning
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    Orthodontic AI
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    3D Simulation
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    Patient Education
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateTo("/ai/diagnosis")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-primary" />
                  Symptom Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered symptom analysis and diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm">Analyze patient symptoms</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateTo("/ai/xray")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <FileImage className="h-5 w-5 mr-2 text-primary" />
                  X-ray Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered radiographic interpretation
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm">Analyze dental radiographs</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateTo("/orthodontic-dashboard")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Teeth className="h-5 w-5 mr-2 text-primary" />
                  Orthodontic AI
                </CardTitle>
                <CardDescription>
                  Comprehensive orthodontic analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm">Create orthodontic treatment plans</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateTo("/ai/treatment-plan")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Treatment Planner
                </CardTitle>
                <CardDescription>
                  AI-optimized treatment planning
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm">Create personalized treatment plans</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateTo("/ai/reports")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Report Generator
                </CardTitle>
                <CardDescription>
                  Automated comprehensive reports
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm">Generate detailed reports</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors col-span-3"
              onClick={() => navigateTo("/ai/chat")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-primary" />
                  DentaMind AI Assistant
                </CardTitle>
                <CardDescription>
                  Interactive AI assistant for dental queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      className="w-full bg-transparent outline-none border-none placeholder:text-muted-foreground"
                      placeholder="Ask me about dental procedures, diagnoses, or treatment options..."
                    />
                  </div>
                  <Button variant="ghost" size="sm">
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Diagnostic Capabilities</CardTitle>
                <CardDescription>
                  Multi-domain AI expertise for comprehensive dental diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "General Dentistry AI",
                      description: "Analyzes symptoms and coordinates specialty AIs"
                    },
                    {
                      title: "Perio AI",
                      description: "Specialized in periodontal disease detection and staging"
                    },
                    {
                      title: "Restorative AI",
                      description: "Identifies caries, fractures and restoration needs"
                    },
                    {
                      title: "Endodontic AI",
                      description: "Assesses pulp vitality and endodontic conditions"
                    },
                    {
                      title: "Prosthodontic AI",
                      description: "Evaluates prosthetic needs and requirements"
                    },
                    {
                      title: "Medical History AI",
                      description: "Cross-checks medical conditions and medications"
                    }
                  ].map((domain, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{domain.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">{domain.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <Button onClick={() => navigateTo("/ai/diagnosis")}>
                    Launch Diagnostic AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Diagnoses</CardTitle>
                <CardDescription>
                  Recently performed AI diagnoses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      patient: "John Smith",
                      diagnosis: "Chronic periodontitis (Stage II, Grade B)",
                      date: "Today, 3:42 PM"
                    },
                    {
                      patient: "Emily Johnson",
                      diagnosis: "Irreversible pulpitis (Tooth #46)",
                      date: "Today, 11:23 AM"
                    },
                    {
                      patient: "David Williams",
                      diagnosis: "Dental caries (Class II, Tooth #36)",
                      date: "Yesterday, 4:15 PM"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{item.patient}</div>
                        <div className="text-sm text-muted-foreground">{item.diagnosis}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Accuracy</CardTitle>
                <CardDescription>
                  AI diagnostic performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <span className="text-sm font-medium">97.8%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "97.8%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Endodontic Diagnosis</span>
                      <span className="text-sm font-medium">98.3%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "98.3%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Periodontal Diagnosis</span>
                      <span className="text-sm font-medium">96.7%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "96.7%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Restorative Diagnosis</span>
                      <span className="text-sm font-medium">98.1%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "98.1%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imaging" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>AI Imaging Analysis</CardTitle>
                <CardDescription>
                  Advanced radiographic interpretation and 3D analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "X-ray Analysis",
                      description: "Detect caries, bone loss, and pathology in 2D radiographs"
                    },
                    {
                      title: "3D CBCT Analysis",
                      description: "Volumetric analysis for implants, endodontics, and pathology"
                    },
                    {
                      title: "Periodontal Measurement",
                      description: "Automated bone level and attachment loss calculation"
                    },
                    {
                      title: "Caries Detection",
                      description: "Early caries identification with confidence scoring"
                    },
                    {
                      title: "Pathology Identification",
                      description: "Detection of periapical lesions, cysts, and tumors"
                    },
                    {
                      title: "Implant Planning",
                      description: "Optimize implant positioning and sizing"
                    }
                  ].map((feature, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <Button onClick={() => navigateTo("/ai/xray")}>
                    Launch Imaging AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  Recently performed imaging analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      patient: "Michael Brown",
                      type: "CBCT Analysis",
                      findings: "Periapical lesion (Tooth #21), maxillary sinus involvement",
                      date: "Today, 2:15 PM"
                    },
                    {
                      patient: "Sarah Johnson",
                      type: "Panoramic X-ray",
                      findings: "Moderate horizontal bone loss, impacted #48",
                      date: "Today, 10:05 AM"
                    },
                    {
                      patient: "Robert Davis",
                      type: "Periapical X-rays",
                      findings: "Deep caries #36, widened PDL #37",
                      date: "Yesterday, 3:45 PM"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileImage className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{item.patient}</div>
                        <div className="text-sm">{item.type}</div>
                        <div className="text-sm text-muted-foreground">{item.findings}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imaging Performance</CardTitle>
                <CardDescription>
                  AI imaging analysis performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Caries Detection</span>
                      <span className="text-sm font-medium">96.5%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "96.5%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Periapical Lesion Detection</span>
                      <span className="text-sm font-medium">97.9%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "97.9%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Bone Level Measurement</span>
                      <span className="text-sm font-medium">98.2%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "98.2%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Anatomical Structure ID</span>
                      <span className="text-sm font-medium">99.4%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "99.4%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Treatment Analytics</CardTitle>
                <CardDescription>
                  AI-powered analytics for optimizing treatment outcomes and practice performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Outcome Prediction",
                      description: "Predict treatment success rates and complications"
                    },
                    {
                      title: "Treatment Comparison",
                      description: "Compare effectiveness of different treatment options"
                    },
                    {
                      title: "Insurance Optimization",
                      description: "Maximize insurance benefits and minimize patient costs"
                    },
                    {
                      title: "Practice Performance",
                      description: "Analyze procedure efficiency and profitability"
                    },
                    {
                      title: "Long-term Outcomes",
                      description: "Predict treatment durability and maintenance needs"
                    },
                    {
                      title: "Resource Utilization",
                      description: "Optimize staff, materials, and equipment usage"
                    }
                  ].map((feature, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <Button onClick={() => navigateTo("/ai/analytics")}>
                    Launch Analytics Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treatment Success Metrics</CardTitle>
                <CardDescription>
                  Success rates by treatment category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Root Canal Therapy</span>
                      <span className="text-sm font-medium">95.8%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: "95.8%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Periodontal Therapy</span>
                      <span className="text-sm font-medium">92.3%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: "92.3%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Implant Placement</span>
                      <span className="text-sm font-medium">97.1%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: "97.1%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Crown & Bridge</span>
                      <span className="text-sm font-medium">96.7%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: "96.7%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Practice Efficiency</CardTitle>
                <CardDescription>
                  AI-recommended optimizations for your practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Procedure Duration",
                      message: "Root canal procedures taking 15% longer than optimal",
                      recommendation: "Review instrument setup and assistant coordination"
                    },
                    {
                      title: "Resource Utilization",
                      message: "Crown & bridge procedures have high material waste",
                      recommendation: "Consider digital impressions and CAD/CAM workflow"
                    },
                    {
                      title: "Treatment Acceptance",
                      message: "Implant treatment plan acceptance below target",
                      recommendation: "Use AI visualization tools for improved case presentation"
                    }
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-amber-600">{item.message}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Recommendation:</span> {item.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
