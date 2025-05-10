import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  Check, 
  DollarSign, 
  Calendar, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Zap, 
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export function AITreatmentPlanner() {
  const [activeTab, setActiveTab] = useState('input');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const { toast } = useToast();
  
  // Mock data - in a real app, this would come from the database
  const mockPatients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Maria Rodriguez' },
    { id: '3', name: 'Robert Johnson' },
  ];
  
  const treatmentPlans = [
    {
      id: 'gold',
      name: 'Gold Standard',
      description: 'Optimal comprehensive care for best health outcomes',
      procedures: [
        { name: 'Scaling and Root Planing (All Quadrants)', cost: 1200, insuranceCoverage: 720 },
        { name: 'Composite Restoration on #30 (DO)', cost: 350, insuranceCoverage: 200 },
        { name: 'Root Canal on #19', cost: 1100, insuranceCoverage: 550 },
        { name: 'Crown on #19', cost: 1250, insuranceCoverage: 500 },
      ],
      totalCost: 3900,
      insuranceCoverage: 1970,
      patientResponsibility: 1930,
      timeframe: '6-8 weeks',
      benefits: [
        'Maximum longevity of restorations',
        'Comprehensive care of all conditions',
        'Highest quality materials',
        'Prevention of future complications'
      ],
      considerations: [
        'Higher initial cost',
        'Multiple appointments required',
        'More extensive treatment'
      ]
    },
    {
      id: 'standard',
      name: 'Standard Coverage',
      description: 'Balance between cost and comprehensive care',
      procedures: [
        { name: 'Scaling and Root Planing (Posterior Quadrants)', cost: 600, insuranceCoverage: 450 },
        { name: 'Composite Restoration on #30 (DO)', cost: 350, insuranceCoverage: 200 },
        { name: 'Root Canal on #19', cost: 1100, insuranceCoverage: 550 },
        { name: 'Crown on #19', cost: 1250, insuranceCoverage: 500 },
      ],
      totalCost: 3300,
      insuranceCoverage: 1700,
      patientResponsibility: 1600,
      timeframe: '4-6 weeks',
      benefits: [
        'Good balance of quality and cost',
        'Addresses primary concerns',
        'Good insurance coverage',
        'Fewer appointments than Gold Standard'
      ],
      considerations: [
        'May require follow-up care for areas not addressed',
        'Materials may be less premium',
        'May need retreatment sooner'
      ]
    },
    {
      id: 'minimal',
      name: 'Basic Care',
      description: 'Essential treatment for immediate concerns',
      procedures: [
        { name: 'Regular Cleaning', cost: 120, insuranceCoverage: 120 },
        { name: 'Amalgam Restoration on #30 (DO)', cost: 200, insuranceCoverage: 150 },
        { name: 'Extraction of #19', cost: 250, insuranceCoverage: 175 },
      ],
      totalCost: 570,
      insuranceCoverage: 445,
      patientResponsibility: 125,
      timeframe: '1-2 weeks',
      benefits: [
        'Lowest immediate cost',
        'Minimal time investment',
        'Addresses acute issues',
        'Maximum insurance coverage percentage'
      ],
      considerations: [
        'Loss of tooth #19',
        'Potential space/alignment issues',
        'May lead to higher costs long-term',
        'Less aesthetic solution'
      ]
    }
  ];
  
  const handleGenerate = () => {
    if (!diagnosisText || !selectedPatient) {
      toast({
        title: "Missing information",
        description: "Please enter diagnosis text and select a patient.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setProgressValue(0);
    
    // Simulate AI treatment plan generation with progress updates
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        const newValue = prev + Math.random() * 15;
        
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setGenerationComplete(true);
            setActiveTab('plans');
            
            toast({
              title: "Treatment plans generated",
              description: "AI has generated 3 treatment plan options.",
              variant: "default"
            });
          }, 500);
          return 100;
        }
        
        return newValue;
      });
    }, 600);
  };
  
  const handleReset = () => {
    setDiagnosisText('');
    setSelectedPatient('');
    setIsGenerating(false);
    setGenerationComplete(false);
    setProgressValue(0);
    setActiveTab('input');
  };
  
  const handleSelectPlan = (index: number) => {
    setSelectedPlanIndex(index);
  };
  
  const handleCreateTreatmentPlan = () => {
    const selectedPlan = treatmentPlans[selectedPlanIndex];
    
    toast({
      title: "Treatment plan created",
      description: `${selectedPlan.name} plan has been created and is ready for review.`,
      variant: "default"
    });
    
    // In a real app, this would send the selected plan to the backend
    // and redirect to the treatment plan details page
  };
  
  const getProgressStatus = () => {
    if (progressValue < 30) return 'Analyzing patient history...';
    if (progressValue < 60) return 'Generating treatment options...';
    if (progressValue < 90) return 'Calculating insurance coverage...';
    return 'Finalizing treatment plans...';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Treatment Planner</h2>
          <p className="text-muted-foreground">Generate customized treatment plans based on diagnosis</p>
        </div>
        {generationComplete && (
          <Button variant="outline" onClick={handleReset}>
            New Plan
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="input" disabled={isGenerating}>
            <FileText className="h-4 w-4 mr-2" />
            Input
          </TabsTrigger>
          <TabsTrigger value="plans" disabled={!generationComplete}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Plan Options
          </TabsTrigger>
          <TabsTrigger value="comparison" disabled={!generationComplete}>
            <Sparkles className="h-4 w-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan Generator</CardTitle>
              <CardDescription>
                Enter diagnosis and patient information to generate AI-powered treatment plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Select Patient</Label>
                <Select 
                  value={selectedPatient} 
                  onValueChange={setSelectedPatient}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis / Clinical Findings</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Enter your clinical findings and diagnosis..."
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  className="min-h-[150px]"
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  Provide detailed information about patient's condition, symptoms, and any relevant diagnostic findings.
                </p>
              </div>
              
              {isGenerating && (
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{getProgressStatus()}</span>
                    <span className="text-sm font-medium">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !diagnosisText || !selectedPatient}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Treatment Plans
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-amber-500" />
                  Fast & Accurate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI generates multiple treatment options in seconds based on diagnosis, patient history, and best practices.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-amber-500" />
                  Insurance Optimized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Plans automatically factor in patient's insurance coverage and maximize benefits.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-amber-500" />
                  Scheduling Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Approved treatment plans can be automatically scheduled based on procedure dependencies.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="plans">
          <div className="grid grid-cols-1 gap-6">
            {treatmentPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${selectedPlanIndex === index ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => handleSelectPlan(index)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {plan.id === 'gold' && <Sparkles className="h-5 w-5 mr-2 text-amber-500" />}
                        {plan.id === 'standard' && <Check className="h-5 w-5 mr-2 text-blue-500" />}
                        {plan.id === 'minimal' && <AlertTriangle className="h-5 w-5 mr-2 text-gray-500" />}
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge className={
                      plan.id === 'gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      plan.id === 'standard' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }>
                      {plan.id === 'gold' ? 'Recommended' :
                       plan.id === 'standard' ? 'Insurance Friendly' :
                       'Budget Option'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center mb-2">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Procedures
                      </h3>
                      <div className="border rounded-md divide-y">
                        {plan.procedures.map((procedure, i) => (
                          <div key={i} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{procedure.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">${procedure.cost}</p>
                              <p className="text-xs text-muted-foreground">Insurance: ${procedure.insuranceCoverage}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium flex items-center mb-2">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Financial Summary
                        </h3>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <span>Total Cost:</span>
                            <span className="text-right font-medium">${plan.totalCost}</span>
                            
                            <span>Insurance:</span>
                            <span className="text-right text-green-600">${plan.insuranceCoverage}</span>
                            
                            <span className="font-medium">Your Cost:</span>
                            <span className="text-right font-medium">${plan.patientResponsibility}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium flex items-center mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          Treatment Details
                        </h3>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <span>Timeframe:</span>
                            <span className="text-right">{plan.timeframe}</span>
                            
                            <span>Appointments:</span>
                            <span className="text-right">{plan.procedures.length}</span>
                            
                            <span>Care Level:</span>
                            <span className="text-right">
                              {plan.id === 'gold' ? 'Comprehensive' :
                               plan.id === 'standard' ? 'Standard' :
                               'Basic'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Benefits</h3>
                        <ul className="text-sm space-y-1">
                          {plan.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Considerations</h3>
                        <ul className="text-sm space-y-1">
                          {plan.considerations.map((consideration, i) => (
                            <li key={i} className="flex items-start">
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-end">
                    <Button variant={selectedPlanIndex === index ? "default" : "outline"}>
                      {selectedPlanIndex === index ? 'Selected' : 'Select This Plan'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            <div className="flex justify-end">
              <Button onClick={handleCreateTreatmentPlan}>
                <FileText className="h-4 w-4 mr-2" />
                Create Treatment Plan
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of available treatment options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b"></th>
                      {treatmentPlans.map(plan => (
                        <th key={plan.id} className="p-3 border-b text-center">
                          <div className="flex flex-col items-center">
                            {plan.id === 'gold' && <Sparkles className="h-5 w-5 mb-1 text-amber-500" />}
                            {plan.id === 'standard' && <Check className="h-5 w-5 mb-1 text-blue-500" />}
                            {plan.id === 'minimal' && <AlertTriangle className="h-5 w-5 mb-1 text-gray-500" />}
                            <span>{plan.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b font-medium">Total Cost</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">${plan.totalCost}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Insurance Coverage</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center text-green-600">${plan.insuranceCoverage}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Patient Cost</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center font-bold">${plan.patientResponsibility}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Timeframe</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">{plan.timeframe}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Number of Procedures</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">{plan.procedures.length}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Primary Focus</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">
                          {plan.id === 'gold' ? 'Comprehensive Care' :
                           plan.id === 'standard' ? 'Essential Treatment' :
                           'Immediate Concerns'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Tooth Preservation</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">
                          {plan.id === 'gold' ? 'Maximum' :
                           plan.id === 'standard' ? 'High' :
                           'Moderate'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Aesthetics</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">
                          {plan.id === 'gold' ? 'Premium' :
                           plan.id === 'standard' ? 'Good' :
                           'Basic'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 border-b font-medium">Longevity</td>
                      {treatmentPlans.map(plan => (
                        <td key={plan.id} className="p-3 border-b text-center">
                          {plan.id === 'gold' ? '10+ years' :
                           plan.id === 'standard' ? '5-10 years' :
                           '2-5 years'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3"></td>
                      {treatmentPlans.map((plan, index) => (
                        <td key={plan.id} className="p-3 text-center">
                          <Button 
                            variant={selectedPlanIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectPlan(index)}
                          >
                            {selectedPlanIndex === index ? 'Selected' : 'Select'}
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleCreateTreatmentPlan}>
                <FileText className="h-4 w-4 mr-2" />
                Create Treatment Plan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}