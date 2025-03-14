import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, AlertTriangle, Brain, Scale, User, FileText, 
  Calendar, DollarSign, Clock, CheckCircle, 
  BarChart, PieChart, Stethoscope, Info
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { AIDomain, generateMultiDomainConsensus, domainExperts } from './ai-domains';
import { InsuranceCoverage, TreatmentPlan, generateTreatmentPlans } from './treatment-plan-generator';
import { verifyInsurance, optimizeTreatmentPlan } from './insurance-optimizer';
import { optimizeTreatmentSchedule, calculateSchedulingEfficiency } from './scheduling-optimizer';

// Props for the AI Hub Dashboard
interface AIHubDashboardProps {
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  onGenerateTreatmentPlan: (planData: any) => void;
  onRequestXRays: () => void;
  onRequestPerioChart: () => void;
}

// Domain card UI state
interface DomainCardState {
  isLoading: boolean;
  isActive: boolean;
  confidenceScore: number;
  expanded: boolean;
}

export function AIHubDashboard({
  patientId,
  doctorId,
  patientName,
  doctorName,
  onGenerateTreatmentPlan,
  onRequestXRays,
  onRequestPerioChart
}: AIHubDashboardProps) {
  // Current active tab
  const [activeTab, setActiveTab] = useState("ai-consensus");
  
  // Domain cards state
  const [domainStates, setDomainStates] = useState<Record<AIDomain, DomainCardState>>({
    general: { isLoading: false, isActive: true, confidenceScore: 0, expanded: false },
    perio: { isLoading: false, isActive: true, confidenceScore: 0, expanded: false },
    endo: { isLoading: false, isActive: true, confidenceScore: 0, expanded: false },
    prostho: { isLoading: false, isActive: true, confidenceScore: 0, expanded: false },
    surgery: { isLoading: false, isActive: false, confidenceScore: 0, expanded: false },
    ortho: { isLoading: false, isActive: false, confidenceScore: 0, expanded: false },
    pediatric: { isLoading: false, isActive: false, confidenceScore: 0, expanded: false },
    insurance: { isLoading: false, isActive: true, confidenceScore: 0, expanded: false }
  });
  
  // Patient symptoms and history (would come from patient records in a real implementation)
  const [patientSymptoms, setPatientSymptoms] = useState("Sensitivity in upper right molar, pain when eating cold foods. Patient also reports bleeding gums when brushing.");
  
  // Treatment plans state
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  
  // AI consensus state
  const [aiConsensus, setAiConsensus] = useState<any>(null);
  const [consensusLoading, setConsensusLoading] = useState(false);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  
  // Insurance information
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceCoverage | null>(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  
  // Schedule optimization state
  const [schedulingEfficiency, setSchedulingEfficiency] = useState<any>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  // Generate initial data on mount
  useEffect(() => {
    // Start with loading state
    setDomainStates(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(domain => {
        newState[domain as AIDomain].isLoading = true;
      });
      return newState;
    });
    
    // Simulate loading of domains sequentially
    const domains: AIDomain[] = ['general', 'perio', 'endo', 'prostho', 'insurance'];
    
    // Simulate the sequential loading of domains
    domains.forEach((domain, index) => {
      setTimeout(() => {
        setDomainStates(prev => ({
          ...prev,
          [domain]: {
            ...prev[domain],
            isLoading: false,
            confidenceScore: Math.floor(70 + Math.random() * 25) // Random score between 70-95
          }
        }));
        
        // After the last domain, generate the consensus
        if (index === domains.length - 1) {
          setTimeout(() => {
            generateConsensus();
          }, 1000);
        }
      }, 800 * (index + 1));
    });
    
    // Verify insurance
    setInsuranceLoading(true);
    setTimeout(async () => {
      const insuranceResponse = await verifyInsurance({
        provider: 'Delta Dental',
        memberId: 'DD123456789',
        patientName: patientName,
        patientDateOfBirth: '1980-05-15'
      });
      
      if (insuranceResponse.planDetails) {
        setInsuranceInfo(insuranceResponse.planDetails as InsuranceCoverage);
      }
      setInsuranceLoading(false);
    }, 2000);
  }, [patientId, patientName]);
  
  // Generate AI consensus
  const generateConsensus = async () => {
    setConsensusLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Generate consensus using the domains service
      const consensus = generateMultiDomainConsensus(patientSymptoms);
      setAiConsensus(consensus);
      
      // Update domain confidence scores from the consensus
      setDomainStates(prev => {
        const newState = { ...prev };
        Object.entries(consensus.domains).forEach(([domain, data]) => {
          if (data.active) {
            newState[domain as AIDomain].confidenceScore = data.confidence;
          }
        });
        return newState;
      });
      
      setConsensusLoading(false);
      
      // Generate treatment plans
      generateTreatmentPlansFromConsensus(consensus);
    }, 2000);
  };
  
  // Generate treatment plans from AI consensus
  const generateTreatmentPlansFromConsensus = (consensus: any) => {
    setTreatmentLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Use the insurance information if available
      const plans = generateTreatmentPlans(
        patientId,
        doctorId,
        consensus,
        insuranceInfo || undefined
      );
      
      setTreatmentPlans(plans);
      setSelectedPlan(plans[0]); // Select gold standard by default
      
      setTreatmentLoading(false);
      
      // Generate scheduling efficiency metrics
      if (plans.length > 0) {
        generateSchedulingMetrics(plans[0]);
      }
    }, 2000);
  };
  
  // Generate scheduling efficiency metrics
  const generateSchedulingMetrics = (plan: TreatmentPlan) => {
    setScheduleLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Generate optimized schedule
      const optimizedAppointments = optimizeTreatmentSchedule(plan);
      
      // Calculate efficiency metrics
      const efficiency = calculateSchedulingEfficiency(plan, optimizedAppointments);
      
      setSchedulingEfficiency(efficiency);
      setScheduleLoading(false);
    }, 1500);
  };
  
  // Toggle a domain's active state
  const toggleDomain = (domain: AIDomain) => {
    setDomainStates(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        isActive: !prev[domain].isActive
      }
    }));
  };
  
  // Expand/collapse a domain card
  const toggleExpandDomain = (domain: AIDomain) => {
    setDomainStates(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        expanded: !prev[domain].expanded
      }
    }));
  };
  
  // Save selected treatment plan
  const saveSelectedPlan = () => {
    if (selectedPlan) {
      onGenerateTreatmentPlan(selectedPlan);
    }
  };
  
  // Handle plan selection
  const handleSelectPlan = (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    // Update scheduling metrics for the new plan
    generateSchedulingMetrics(plan);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Diagnosis & Treatment Hub</h1>
          <p className="text-muted-foreground">
            Multi-AI consensus system for comprehensive dental care planning
          </p>
        </div>
        
        <Card className="w-auto">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center space-x-4">
              <User className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{patientName}</CardTitle>
                <CardDescription>Patient ID: {patientId}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRequestXRays}
              >
                Request X-Rays
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRequestPerioChart}
              >
                Update Perio Chart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="ai-consensus" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai-consensus">AI Consensus</TabsTrigger>
          <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai-consensus" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Multi-AI Domain Consensus</h2>
            <Button 
              variant="default" 
              onClick={generateConsensus}
              disabled={consensusLoading}
            >
              <Brain className="mr-2 h-4 w-4" />
              {consensusLoading ? "Generating..." : "Regenerate Analysis"}
            </Button>
          </div>
          
          {/* Patient symptoms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Patient's Chief Complaint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{patientSymptoms}</p>
            </CardContent>
          </Card>
          
          {/* Domain experts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {Object.entries(domainStates).map(([domain, state]) => {
              const domainKey = domain as AIDomain;
              const expert = domainExperts[domainKey];
              
              // Skip inactive domains in certain cases
              if (!state.isActive && !state.expanded) {
                return null;
              }
              
              return (
                <Card 
                  key={domain}
                  className={`${state.expanded ? 'col-span-full' : ''} 
                             ${state.isActive ? '' : 'opacity-60'}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <span className="mr-2">{expert.avatar}</span>
                        {expert.specialty}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => toggleExpandDomain(domainKey)}
                        >
                          {state.expanded ? '−' : '+'}
                        </Button>
                        <Button 
                          variant={state.isActive ? "default" : "outline"} 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => toggleDomain(domainKey)}
                        >
                          {state.isActive ? "Active" : "Inactive"}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {expert.name} • {expert.experience} experience
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    {state.isLoading ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Analyzing...</p>
                        <Progress value={45} className="h-2" />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted-foreground">
                            Confidence Score
                          </div>
                          <Badge 
                            variant={state.confidenceScore > 85 ? "default" : 
                                  state.confidenceScore > 70 ? "outline" : "secondary"}
                          >
                            {state.confidenceScore}%
                          </Badge>
                        </div>
                        
                        {state.expanded && aiConsensus && aiConsensus.domains[domainKey].active && (
                          <div className="mt-4 space-y-4">
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium mb-2">Domain Analysis</h4>
                              <p className="text-sm text-muted-foreground">
                                {aiConsensus.domains[domainKey].diagnosticSummary}
                              </p>
                            </div>
                            
                            {aiConsensus.domains[domainKey].findings.map((finding: any, i: number) => (
                              <div key={i} className="space-y-2 border rounded-md p-3">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{finding.finding}</h4>
                                  <Badge>{finding.confidence}%</Badge>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium mb-1">Evidence:</h5>
                                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                    {finding.evidencePoints.map((point: string, j: number) => (
                                      <li key={j}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
                                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                    {finding.recommendations.map((rec: string, j: number) => (
                                      <li key={j}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {finding.suggestedProcedures && finding.suggestedProcedures.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Suggested Procedures:</h5>
                                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                      {finding.suggestedProcedures.map((proc: string, j: number) => (
                                        <li key={j}>{proc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                <div className="flex items-center mt-1">
                                  <span className="text-sm font-medium mr-2">Urgency:</span>
                                  <Badge 
                                    variant={finding.urgency === 'urgent' ? "destructive" : 
                                          finding.urgency === 'high' ? "default" : 
                                          finding.urgency === 'medium' ? "outline" : "secondary"}
                                  >
                                    {finding.urgency}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Overall consensus view */}
          {aiConsensus && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Comprehensive Diagnosis
                </CardTitle>
                <CardDescription>
                  Multi-domain AI consensus with {aiConsensus.consensusLevel} agreement level
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="font-medium">{aiConsensus.overallDiagnosis}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Treatment Recommendations</h3>
                  <ul className="space-y-2">
                    {aiConsensus.treatmentRecommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {aiConsensus.conflictingOpinions && aiConsensus.conflictingOpinions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Conflicting Opinions Resolution</h3>
                    <div className="space-y-3">
                      {aiConsensus.conflictingOpinions.map((conflict: any, i: number) => (
                        <div key={i} className="p-3 border rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{conflict.description}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Domains involved: {conflict.domains.join(', ')}
                              </p>
                              <p className="text-sm mt-2">
                                <span className="font-medium">Resolution: </span> 
                                {conflict.resolution}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setActiveTab("treatment-plans")}>
                    View Treatment Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="treatment-plans" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Treatment Plan Options
            </h2>
            <Button
              onClick={saveSelectedPlan}
              disabled={!selectedPlan || treatmentLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Save Selected Plan
            </Button>
          </div>
          
          {treatmentLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-muted-foreground">Generating treatment plans...</p>
                  <Progress value={65} className="w-[60%]" />
                </div>
              </CardContent>
            </Card>
          ) : treatmentPlans.length > 0 ? (
            <>
              {/* Plan selection cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {treatmentPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer hover:border-primary transition-colors ${
                      selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Estimate:</span>
                          <span className="font-medium">${plan.costEstimate.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Insurance:</span>
                          <span className="font-medium">${plan.insuranceCoverage.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Out of pocket:</span>
                          <span className="font-medium">${plan.outOfPocket.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Visits:</span>
                          <span className="font-medium">{plan.visitCount}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Badge 
                        className="w-full justify-center"
                        variant={
                          plan.type === 'gold' ? 'default' : 
                          plan.type === 'insurance' ? 'outline' : 'secondary'
                        }
                      >
                        {plan.type === 'gold' ? 'Gold Standard' : 
                        plan.type === 'insurance' ? 'Insurance Optimized' : 'Phased Treatment'}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Selected plan details */}
              {selectedPlan && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Selected Plan: {selectedPlan.name}</CardTitle>
                    <CardDescription>
                      {selectedPlan.estimatedCompletionTime} • Estimated cost: ${selectedPlan.costEstimate.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Accordion type="multiple" className="w-full">
                        {/* Group procedures by visit */}
                        {Array.from({ length: selectedPlan.visitCount }, (_, i) => i + 1).map(visitNumber => {
                          const visitProcedures = selectedPlan.procedures.filter(
                            proc => proc.visit === visitNumber
                          );
                          
                          if (visitProcedures.length === 0) return null;
                          
                          const visitTotal = visitProcedures.reduce(
                            (sum, proc) => sum + proc.cost, 0
                          );
                          
                          const visitCoverage = visitProcedures.reduce(
                            (sum, proc) => sum + proc.coverage, 0
                          );
                          
                          const visitOutOfPocket = visitTotal - visitCoverage;
                          
                          return (
                            <AccordionItem key={visitNumber} value={`visit-${visitNumber}`}>
                              <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                                <div className="flex justify-between items-center w-full mr-4">
                                  <div className="flex items-center">
                                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                                    <span>Visit {visitNumber}</span>
                                  </div>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                                      <span>${visitTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{visitProcedures.length} procedures</span>
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 p-2">
                                  {visitProcedures.map(procedure => (
                                    <Card key={procedure.id} className="overflow-hidden">
                                      <CardHeader className="pb-2 pt-3 px-4">
                                        <div className="flex justify-between">
                                          <div>
                                            <CardTitle className="text-base">{procedure.name}</CardTitle>
                                            <CardDescription className="flex items-center">
                                              <span>{procedure.cdtCode}</span>
                                              <span className="mx-2">•</span>
                                              <Badge 
                                                variant={
                                                  procedure.priority === 'urgent' ? 'destructive' : 
                                                  procedure.priority === 'high' ? 'default' :
                                                  procedure.priority === 'medium' ? 'outline' : 'secondary'
                                                }
                                                className="ml-1"
                                              >
                                                {procedure.priority}
                                              </Badge>
                                            </CardDescription>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-medium">${procedure.cost.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">
                                              Insurance: ${procedure.coverage.toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="pb-3 pt-0 px-4">
                                        <div className="text-sm text-muted-foreground mb-2">
                                          {procedure.description}
                                        </div>
                                        
                                        {procedure.teeth && procedure.teeth.length > 0 && (
                                          <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-sm font-medium">Teeth:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {procedure.teeth.map(tooth => (
                                                <Badge key={tooth} variant="outline" className="text-xs">
                                                  #{tooth}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {procedure.notes && (
                                          <div className="text-sm italic mt-2">
                                            Note: {procedure.notes}
                                          </div>
                                        )}
                                        
                                        {procedure.alternatives && procedure.alternatives.length > 0 && (
                                          <div className="mt-3">
                                            <Accordion type="single" collapsible className="w-full">
                                              <AccordionItem value="alternatives">
                                                <AccordionTrigger className="text-sm py-1">
                                                  Alternative Options
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                  {procedure.alternatives.map((alt, i) => (
                                                    <div key={i} className="p-3 border rounded-md mt-2">
                                                      <div className="flex justify-between">
                                                        <div>
                                                          <div className="font-medium text-sm">{alt.name}</div>
                                                          <div className="text-xs text-muted-foreground">{alt.cdtCode}</div>
                                                        </div>
                                                        <div className="text-right">
                                                          <div className="font-medium text-sm">${alt.cost.toLocaleString()}</div>
                                                          <div className="text-xs text-muted-foreground">
                                                            Coverage: ${alt.coverage.toLocaleString()}
                                                          </div>
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <div className="space-y-1">
                                                          <div className="text-xs font-medium text-green-600">Pros:</div>
                                                          <ul className="text-xs list-disc pl-4 space-y-0.5">
                                                            {alt.pros.map((pro, j) => (
                                                              <li key={j}>{pro}</li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                        <div className="space-y-1">
                                                          <div className="text-xs font-medium text-red-600">Cons:</div>
                                                          <ul className="text-xs list-disc pl-4 space-y-0.5">
                                                            {alt.cons.map((con, j) => (
                                                              <li key={j}>{con}</li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </AccordionContent>
                                              </AccordionItem>
                                            </Accordion>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                  
                                  <div className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                                    <div>
                                      <div className="font-medium">Visit Total</div>
                                      <div className="text-sm text-muted-foreground">
                                        Insurance covers ${visitCoverage.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">${visitTotal.toLocaleString()}</div>
                                      <div className="text-sm">
                                        Out of pocket: ${visitOutOfPocket.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Provider: {doctorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated on {new Date(selectedPlan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={saveSelectedPlan}>Save Treatment Plan</Button>
                  </CardFooter>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-4">No treatment plans generated yet</p>
                  <Button onClick={() => setActiveTab("ai-consensus")}>
                    Generate Treatment Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="insurance" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Insurance Optimization</h2>
            <Button 
              variant="outline" 
              disabled={!insuranceInfo || !selectedPlan}
              onClick={() => {
                if (insuranceInfo && selectedPlan) {
                  const optimizedPlan = optimizeTreatmentPlan(selectedPlan, insuranceInfo, {});
                  setSelectedPlan(optimizedPlan);
                  setActiveTab("treatment-plans");
                }
              }}
            >
              <Scale className="mr-2 h-4 w-4" />
              Re-Optimize for Insurance
            </Button>
          </div>
          
          {insuranceLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-muted-foreground">Verifying insurance information...</p>
                  <Progress value={45} className="w-[60%]" />
                </div>
              </CardContent>
            </Card>
          ) : insuranceInfo ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Details</CardTitle>
                  <CardDescription>
                    Provider: {insuranceInfo.provider} ({insuranceInfo.planType})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan Name</p>
                      <p className="font-medium">{insuranceInfo.planName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member ID</p>
                      <p className="font-medium">{insuranceInfo.memberID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Maximum</p>
                      <p className="font-medium">${insuranceInfo.annualMaximum.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Benefit</p>
                      <p className="font-medium">${insuranceInfo.remainingBenefit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deductible</p>
                      <p className="font-medium">${insuranceInfo.deductible.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Deductible</p>
                      <p className="font-medium">${insuranceInfo.deductible.remaining.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Coverage Percentages</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Preventive</span>
                        <Badge variant="outline">{insuranceInfo.coveragePercentages.preventive}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Basic</span>
                        <Badge variant="outline">{insuranceInfo.coveragePercentages.basic}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Major</span>
                        <Badge variant="outline">{insuranceInfo.coveragePercentages.major}%</Badge>
                      </div>
                      {insuranceInfo.coveragePercentages.orthodontic && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Orthodontic</span>
                          <Badge variant="outline">{insuranceInfo.coveragePercentages.orthodontic}%</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Frequency Limitations</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Exams</span>
                        <span className="text-sm">{insuranceInfo.frequencyLimitations.exams}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cleanings</span>
                        <span className="text-sm">{insuranceInfo.frequencyLimitations.cleanings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">X-Rays</span>
                        <span className="text-sm">{insuranceInfo.frequencyLimitations.xrays}</span>
                      </div>
                      {insuranceInfo.frequencyLimitations.crowns && (
                        <div className="flex justify-between">
                          <span className="text-sm">Crowns</span>
                          <span className="text-sm">{insuranceInfo.frequencyLimitations.crowns}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Analysis</CardTitle>
                  <CardDescription>
                    Analysis of selected treatment plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedPlan ? (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-3 rounded-full bg-primary"></div>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">Insurance Coverage</div>
                            <div className="text-sm">
                              ${selectedPlan.insuranceCoverage.toLocaleString()} 
                              ({Math.round((selectedPlan.insuranceCoverage / selectedPlan.costEstimate) * 100)}%)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-3 rounded-full bg-red-500"></div>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">Out-of-Pocket Cost</div>
                            <div className="text-sm">
                              ${selectedPlan.outOfPocket.toLocaleString()} 
                              ({Math.round((selectedPlan.outOfPocket / selectedPlan.costEstimate) * 100)}%)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-3 rounded-full bg-green-500"></div>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">Remaining Benefit</div>
                            <div className="text-sm">
                              ${Math.max(0, insuranceInfo.remainingBenefit - selectedPlan.insuranceCoverage).toLocaleString()} 
                              after treatment
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative h-36">
                        {/* Doughnut chart would go here in a real implementation */}
                        <div className="flex items-center justify-center h-full">
                          <PieChart className="h-24 w-24 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Insurance Optimization Tips</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Consider completing high-priority and preventive procedures first</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Phase major restorative work across benefit years for maximum coverage</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Submit pre-authorizations for major treatments over $500</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Consider insurance alternatives for cosmetic procedures</span>
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Select a treatment plan to view coverage analysis</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("treatment-plans")}
                      >
                        Go to Treatment Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Payment options card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Payment Options</CardTitle>
                  <CardDescription>
                    Ways to manage out-of-pocket expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPlan ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Pay in Full</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="font-medium text-2xl mb-2">
                            ${Math.round(selectedPlan.outOfPocket * 0.95).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            5% discount when paid in full before treatment
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" variant="outline">Select</Button>
                        </CardFooter>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">6 Month Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="font-medium text-2xl mb-2">
                            ${Math.round(selectedPlan.outOfPocket / 6).toLocaleString()}/mo
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Zero interest for 6 months, no credit check
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" variant="default">Select</Button>
                        </CardFooter>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">12 Month Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="font-medium text-2xl mb-2">
                            ${Math.round(selectedPlan.outOfPocket / 12).toLocaleString()}/mo
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Low interest (7.9% APR), longer term
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" variant="outline">Select</Button>
                        </CardFooter>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-muted-foreground">Select a treatment plan to view payment options</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-4">No insurance information available</p>
                  <Button variant="outline">Verify Insurance</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scheduling" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Appointment Optimization</h2>
            <Button 
              disabled={!selectedPlan || scheduleLoading}
              onClick={() => generateSchedulingMetrics(selectedPlan!)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {scheduleLoading ? "Optimizing..." : "Re-Optimize Schedule"}
            </Button>
          </div>
          
          {scheduleLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-muted-foreground">Optimizing appointment schedule...</p>
                  <Progress value={55} className="w-[60%]" />
                </div>
              </CardContent>
            </Card>
          ) : schedulingEfficiency ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduling Efficiency</CardTitle>
                  <CardDescription>
                    Comparison between original and optimized schedule
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Original Visits</div>
                      <div className="text-3xl font-bold">{schedulingEfficiency.originalVisits}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Optimized Visits</div>
                      <div className="text-3xl font-bold text-primary">{schedulingEfficiency.optimizedVisits}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Original Chair Time</div>
                      <div className="text-xl font-bold">
                        {Math.floor(schedulingEfficiency.originalChairTime / 60)}h {schedulingEfficiency.originalChairTime % 60}m
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Optimized Chair Time</div>
                      <div className="text-xl font-bold text-primary">
                        {Math.floor(schedulingEfficiency.optimizedChairTime / 60)}h {schedulingEfficiency.optimizedChairTime % 60}m
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Visit Reduction</span>
                      <span className="text-sm font-medium text-green-600">
                        {schedulingEfficiency.visitReduction} visits ({Math.round(schedulingEfficiency.visitReductionPercentage)}%)
                      </span>
                    </div>
                    <Progress 
                      value={schedulingEfficiency.visitReductionPercentage} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Chair Time Reduction</span>
                      <span className="text-sm font-medium text-green-600">
                        {Math.floor(schedulingEfficiency.timeReduction / 60)}h {schedulingEfficiency.timeReduction % 60}m ({Math.round(schedulingEfficiency.timeReductionPercentage)}%)
                      </span>
                    </div>
                    <Progress 
                      value={schedulingEfficiency.timeReductionPercentage} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Efficiency Improvements</h3>
                    <ul className="space-y-2">
                      {schedulingEfficiency.efficiencyGains.map((gain, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{gain}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Visualized Comparison</CardTitle>
                  <CardDescription>
                    Before and after optimization comparison
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[240px] flex items-center justify-center">
                    <BarChart className="h-full w-full text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Optimized Schedule</CardTitle>
                  <CardDescription>
                    Procedure grouping based on clinical guidelines and efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visit</TableHead>
                        <TableHead>Procedures</TableHead>
                        <TableHead>Estimated Duration</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Mocked appointment data */}
                      <TableRow>
                        <TableCell className="font-medium">Visit 1</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Comprehensive Exam</div>
                            <div>Full Mouth X-rays</div>
                            <div>Periodontal Evaluation</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 15m</TableCell>
                        <TableCell>{doctorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">High</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Visit 2</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Scaling and Root Planing (Upper Right)</div>
                            <div>Scaling and Root Planing (Upper Left)</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 30m</TableCell>
                        <TableCell>Dr. Marcus Chen</TableCell>
                        <TableCell>
                          <Badge>High</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Visit 3</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Scaling and Root Planing (Lower Right)</div>
                            <div>Scaling and Root Planing (Lower Left)</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 30m</TableCell>
                        <TableCell>Dr. Marcus Chen</TableCell>
                        <TableCell>
                          <Badge variant="outline">Medium</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Visit 4</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Root Canal Therapy (Tooth #19)</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 30m</TableCell>
                        <TableCell>Dr. Alicia Patel</TableCell>
                        <TableCell>
                          <Badge variant="outline">Medium</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Visit 5</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Crown Preparation (Tooth #19)</div>
                            <div>Composite Filling (Tooth #30)</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 45m</TableCell>
                        <TableCell>{doctorName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Low</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Visit 6</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Crown Delivery (Tooth #19)</div>
                            <div>Periodontal Maintenance</div>
                          </div>
                        </TableCell>
                        <TableCell>1h 00m</TableCell>
                        <TableCell>{doctorName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Low</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Schedule optimization prioritizes clinical outcomes while maximizing chair time efficiency
                  </p>
                  <Button>Create Appointments</Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-4">No scheduling data generated yet</p>
                  <Button 
                    disabled={!selectedPlan}
                    onClick={() => {
                      if (selectedPlan) {
                        generateSchedulingMetrics(selectedPlan);
                      }
                    }}
                  >
                    Generate Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}