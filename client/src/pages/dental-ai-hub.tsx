
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientEducation } from '@/components/education/patient-education';
import { AdvancedXRayAnalyzer } from '@/components/ai/advanced-xray-analyzer';
import { AITreatmentPlanner } from '@/components/treatment/ai-treatment-planner';
import { Loader, Brain, BookOpen, Zap, Lightbulb, PanelLeft, ImagePlus, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardShell } from '@/components/dashboard/shell';

export default function DentalAIHub() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dental AI Hub"
        text="Advanced AI tools for comprehensive dental diagnosis and education"
      />
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">
            <Brain className="h-4 w-4 mr-2" />
            AI Dashboard
          </TabsTrigger>
          <TabsTrigger value="xray">
            <ImagePlus className="h-4 w-4 mr-2" />
            X-Ray Analysis
          </TabsTrigger>
          <TabsTrigger value="treatment">
            <Zap className="h-4 w-4 mr-2" />
            Treatment Planner
          </TabsTrigger>
          <TabsTrigger value="education">
            <BookOpen className="h-4 w-4 mr-2" />
            Education Library
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-amber-500" />
                  AI Activity
                </CardTitle>
                <CardDescription>Recent AI analyses and predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded">
                      <Brain className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Periapical Analysis</h4>
                      <p className="text-sm text-muted-foreground">Completed 10 minutes ago</p>
                      <p className="text-xs text-green-600 mt-1">High confidence (94%)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <PanelLeft className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Treatment Plan Generation</h4>
                      <p className="text-sm text-muted-foreground">Completed 1 hour ago</p>
                      <p className="text-xs text-blue-600 mt-1">3 options generated</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-amber-100 p-2 rounded">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Symptom Analysis</h4>
                      <p className="text-sm text-muted-foreground">Completed yesterday</p>
                      <p className="text-xs text-amber-600 mt-1">Medium urgency detected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                  AI Insights
                </CardTitle>
                <CardDescription>Trends and patterns in patient data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium">Periodontal Risk Factors</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      30% increase in periodontal disease detection compared to previous month.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium">Treatment Success Rates</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Root canal treatments show 92% success rate based on follow-up X-rays.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium">Caries Prediction</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI identified 15 patients at high risk of new carious lesions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Loader className="h-5 w-5 mr-2 text-amber-500" />
                  AI Engine Status
                </CardTitle>
                <CardDescription>System health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">Image Analysis</span>
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">Treatment Planning</span>
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">Symptom Analysis</span>
                      <span className="text-xs font-medium text-yellow-600">High Load</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last system update: Today at 06:42 AM
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>AI Diagnostic Performance</CardTitle>
                <CardDescription>
                  Accuracy metrics across different dental domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-muted-foreground">Performance metrics visualization would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="xray">
          <AdvancedXRayAnalyzer />
        </TabsContent>
        
        <TabsContent value="education">
          <PatientEducation />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
