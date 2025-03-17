import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  Brain, 
  CalendarCheck, 
  Check, 
  ChevronsUpDown, 
  ClipboardCheck, 
  CreditCard, 
  Download, 
  EditIcon, 
  FileText, 
  GripVertical, 
  InfoIcon, 
  ListTodo, 
  MoreHorizontal, 
  Plus, 
  Printer, 
  Sparkles, 
  ThumbsUp, 
  Trash2 
} from "lucide-react";

interface PatientTreatmentPlanProps {
  patientId: number;
}

interface TreatmentStep {
  id: number;
  treatmentPlanId: number;
  procedure: string;
  description?: string;
  status: "planned" | "scheduled" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  scheduledDate?: string;
  completedDate?: string;
  cost: number;
  estimatedTime?: string;
  provider?: string;
  notes?: string;
  teeth?: string[];
  order: number;
}

interface TreatmentPlan {
  id: number;
  patientId: number;
  title: string;
  description?: string;
  status: "active" | "completed" | "cancelled" | "draft";
  createdDate: string;
  createdById: number;
  createdByName: string;
  lastUpdatedDate?: string;
  completedDate?: string;
  totalCost: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
  consentSigned?: boolean;
  consentDate?: string;
  aiGenerated?: boolean;
  steps: TreatmentStep[];
}

export function PatientTreatmentPlan({ patientId }: PatientTreatmentPlanProps) {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  
  // Fetch patient treatment plans
  const { data: treatmentPlans, isLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${patientId}/treatment-plans`);
        return res.json();
      } catch (error) {
        console.error("Failed to fetch treatment plans:", error);
        return [];
      }
    },
  });

  // Sample treatment plans for demonstration
  const sampleTreatmentPlans: TreatmentPlan[] = [
    {
      id: 1,
      patientId,
      title: "Comprehensive Dental Restoration",
      description: "Full mouth rehabilitation focusing on posterior quadrants",
      status: "active",
      createdDate: "2025-02-10T10:30:00Z",
      createdById: 1,
      createdByName: "Dr. Johnson",
      lastUpdatedDate: "2025-02-15T14:45:00Z",
      totalCost: 5250,
      insuranceCoverage: 3000,
      patientResponsibility: 2250,
      consentSigned: true,
      consentDate: "2025-02-12T11:20:00Z",
      steps: [
        {
          id: 101,
          treatmentPlanId: 1,
          procedure: "Scaling and Root Planing",
          description: "Deep cleaning of all quadrants to treat periodontal disease",
          status: "completed",
          priority: "high",
          scheduledDate: "2025-02-15T10:00:00Z",
          completedDate: "2025-02-15T11:30:00Z",
          cost: 950,
          estimatedTime: "90 minutes",
          provider: "Dr. Johnson",
          notes: "Patient tolerated procedure well. Recommended chlorhexidine rinse twice daily for 2 weeks.",
          order: 1
        },
        {
          id: 102,
          treatmentPlanId: 1,
          procedure: "Root Canal Therapy",
          description: "Endodontic treatment of tooth #30",
          status: "scheduled",
          priority: "high",
          scheduledDate: "2025-03-01T14:00:00Z",
          cost: 1200,
          estimatedTime: "60 minutes",
          provider: "Dr. Smith",
          teeth: ["#30"],
          order: 2
        },
        {
          id: 103,
          treatmentPlanId: 1,
          procedure: "Crown Placement",
          description: "PFM crown on tooth #30",
          status: "planned",
          priority: "medium",
          cost: 1250,
          teeth: ["#30"],
          order: 3
        },
        {
          id: 104,
          treatmentPlanId: 1,
          procedure: "Composite Fillings",
          description: "Composite restorations on teeth #2, #15, and #18",
          status: "planned",
          priority: "medium",
          cost: 750,
          teeth: ["#2", "#15", "#18"],
          order: 4
        },
        {
          id: 105,
          treatmentPlanId: 1,
          procedure: "Nightguard Fabrication",
          description: "Custom nightguard for bruxism protection",
          status: "planned",
          priority: "low",
          cost: 550,
          order: 5
        }
      ]
    },
    {
      id: 2,
      patientId,
      title: "Cosmetic Enhancement Plan",
      description: "Aesthetic improvements focusing on anterior teeth",
      status: "draft",
      createdDate: "2025-03-05T09:15:00Z",
      createdById: 1,
      createdByName: "Dr. Johnson",
      totalCost: 4800,
      aiGenerated: true,
      steps: [
        {
          id: 201,
          treatmentPlanId: 2,
          procedure: "Teeth Whitening",
          description: "In-office professional whitening treatment",
          status: "planned",
          priority: "medium",
          cost: 500,
          estimatedTime: "60 minutes",
          order: 1
        },
        {
          id: 202,
          treatmentPlanId: 2,
          procedure: "Porcelain Veneers",
          description: "Porcelain veneers on teeth #7-10",
          status: "planned",
          priority: "medium",
          cost: 4300,
          estimatedTime: "120 minutes",
          teeth: ["#7", "#8", "#9", "#10"],
          order: 2
        }
      ]
    }
  ];

  // Use the real data if available, otherwise use sample data
  const displayPlans = treatmentPlans || sampleTreatmentPlans;

  // Filter plans based on active tab
  const filteredPlans = displayPlans.filter(plan => 
    activeTab === "all" || 
    activeTab === "ai-generated" && plan.aiGenerated || 
    plan.status === activeTab
  );

  // Calculate plan progress
  const calculateProgress = (plan: TreatmentPlan) => {
    if (plan.steps.length === 0) return 0;
    const completedSteps = plan.steps.filter(step => step.status === "completed").length;
    return Math.round((completedSteps / plan.steps.length) * 100);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Treatment Plans</h2>
          <p className="text-muted-foreground">Manage and track patient treatment plans</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setShowNewPlanDialog(true)}>
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Plans</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
          <TabsTrigger value="all">All Plans</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-3"></div>
              <p className="text-muted-foreground">Loading treatment plans...</p>
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className={`overflow-hidden ${plan.aiGenerated ? "border-primary/20 bg-primary/5" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedPlan(plan)}>
                          {plan.aiGenerated && <Brain className="h-4 w-4 text-primary" />}
                          {plan.title}
                        </CardTitle>
                        <CardDescription>
                          Created on {new Date(plan.createdDate).toLocaleDateString()} by {plan.createdByName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            plan.status === "active" ? "border-green-200 text-green-800" :
                            plan.status === "completed" ? "border-blue-200 text-blue-800" :
                            plan.status === "cancelled" ? "border-red-200 text-red-800" :
                            "border-amber-200 text-amber-800"
                          }
                        >
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </Badge>
                        <div className="flex">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm font-medium">{calculateProgress(plan)}%</span>
                      </div>
                      <Progress value={calculateProgress(plan)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="font-medium">{formatCurrency(plan.totalCost)}</p>
                      </div>
                      
                      {plan.insuranceCoverage !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground">Insurance Coverage</p>
                          <p className="font-medium">{formatCurrency(plan.insuranceCoverage)}</p>
                        </div>
                      )}
                      
                      {plan.patientResponsibility !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground">Patient Responsibility</p>
                          <p className="font-medium">{formatCurrency(plan.patientResponsibility)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium">Treatment Steps</h4>
                      <div className="space-y-2">
                        {plan.steps.slice(0, 3).map((step) => (
                          <div 
                            key={step.id} 
                            className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                              step.status === "completed" ? "bg-green-100" :
                              step.status === "scheduled" ? "bg-blue-100" :
                              step.status === "cancelled" ? "bg-red-100" :
                              "bg-gray-100"
                            }`}>
                              {step.status === "completed" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <span className="text-xs font-medium">{step.order}</span>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-medium truncate">{step.procedure}</p>
                              <div className="flex items-center">
                                {step.teeth && (
                                  <span className="text-xs text-muted-foreground mr-2">
                                    Teeth: {step.teeth.join(", ")}
                                  </span>
                                )}
                                {step.scheduledDate && (
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <CalendarCheck className="h-3 w-3 mr-1" />
                                    {new Date(step.scheduledDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant={
                                step.status === "completed" ? "outline" :
                                step.status === "scheduled" ? "secondary" :
                                step.status === "cancelled" ? "destructive" :
                                "outline"
                              }
                              className="ml-2 flex-shrink-0"
                            >
                              {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                        
                        {plan.steps.length > 3 && (
                          <Button 
                            variant="ghost" 
                            className="w-full text-sm text-muted-foreground"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            View all {plan.steps.length} steps <ChevronsUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                      <div>
                        {plan.status === "draft" && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <EditIcon className="h-4 w-4" />
                            Edit Plan
                          </Button>
                        )}
                        {plan.status === "active" && !plan.consentSigned && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <ClipboardCheck className="h-4 w-4" />
                            Mark Consent
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border">
              <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No Treatment Plans Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                There are no {activeTab !== "all" && activeTab !== "ai-generated" ? activeTab : ""} 
                {activeTab === "ai-generated" ? "AI generated " : ""} 
                treatment plans available for this patient.
              </p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => setShowNewPlanDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Create Treatment Plan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Treatment Plan Dialog */}
      <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New Treatment Plan</DialogTitle>
            <DialogDescription>
              Create a comprehensive treatment plan for this patient
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="planTitle">Plan Title</Label>
              <Input id="planTitle" placeholder="e.g. Comprehensive Restoration" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planDescription">Description</Label>
              <Textarea 
                id="planDescription" 
                placeholder="Enter a description of the overall treatment plan" 
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Treatment Steps</Label>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </div>
              
              <div className="space-y-4 mt-3">
                {[1, 2].map((stepNum) => (
                  <div key={stepNum} className="border rounded-md p-4 relative">
                    <div className="absolute -left-3 -top-3 flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-medium">
                      {stepNum}
                    </div>
                    <div className="absolute right-2 top-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Procedure</Label>
                        <Input placeholder="e.g. Root Canal Therapy" />
                      </div>
                      <div className="space-y-2">
                        <Label>Affected Teeth</Label>
                        <Input placeholder="e.g. #18, #19" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <Label>Description</Label>
                      <Textarea rows={2} placeholder="Brief description of the procedure" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Cost</Label>
                        <Input placeholder="Enter cost" type="number" min="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Time</Label>
                        <Input placeholder="e.g. 60 minutes" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button variant="ghost" size="sm" className="text-red-500 gap-1">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">AI Assistance</h3>
              
              <div className="flex items-start space-x-3 p-4 bg-primary/5 border border-primary/20 rounded-md">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-primary font-medium">Generate Treatment Plan with AI</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    DentaMind can suggest an optimal treatment plan based on the patient's dental history, x-rays, and current conditions.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-1 border-primary/50 text-primary"
                  >
                    <Brain className="h-4 w-4" />
                    Generate AI Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full items-center">
              <div className="flex items-center space-x-2">
                <Checkbox id="saveDraft" />
                <Label htmlFor="saveDraft">Save as draft</Label>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewPlanDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNewPlanDialog(false)}>
                  Create Plan
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Plan Detail Dialog */}
      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedPlan.aiGenerated && <Brain className="h-5 w-5 text-primary" />}
                    {selectedPlan.title}
                  </DialogTitle>
                  <DialogDescription>
                    Created on {new Date(selectedPlan.createdDate).toLocaleDateString()} by {selectedPlan.createdByName}
                  </DialogDescription>
                </div>
                <Badge 
                  variant="outline"
                  className={
                    selectedPlan.status === "active" ? "border-green-200 text-green-800" :
                    selectedPlan.status === "completed" ? "border-blue-200 text-blue-800" :
                    selectedPlan.status === "cancelled" ? "border-red-200 text-red-800" :
                    "border-amber-200 text-amber-800"
                  }
                >
                  {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {selectedPlan.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p>{selectedPlan.description}</p>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
                  <p className="text-lg font-medium">{formatCurrency(selectedPlan.totalCost)}</p>
                </div>
                
                {selectedPlan.insuranceCoverage !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Insurance Coverage</h3>
                    <p className="text-lg font-medium">{formatCurrency(selectedPlan.insuranceCoverage)}</p>
                  </div>
                )}
                
                {selectedPlan.patientResponsibility !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient Responsibility</h3>
                    <p className="text-lg font-medium">{formatCurrency(selectedPlan.patientResponsibility)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Treatment Steps</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Progress:</span>
                    <Progress value={calculateProgress(selectedPlan)} className="h-2 w-24" />
                    <span className="text-sm font-medium">{calculateProgress(selectedPlan)}%</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedPlan.steps.map((step) => (
                    <div 
                      key={step.id} 
                      className="relative border rounded-md p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`absolute -left-3 -top-3 flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                        step.status === "completed" ? "bg-green-500 text-white" :
                        step.status === "scheduled" ? "bg-blue-500 text-white" :
                        step.status === "cancelled" ? "bg-red-500 text-white" :
                        "bg-gray-200 text-gray-700"
                      }`}>
                        {step.status === "completed" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <span>{step.order}</span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{step.procedure}</h4>
                        <Badge 
                          variant={
                            step.status === "completed" ? "outline" :
                            step.status === "scheduled" ? "secondary" :
                            step.status === "cancelled" ? "destructive" :
                            "outline"
                          }
                        >
                          {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                        </Badge>
                      </div>
                      
                      {step.description && (
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <p className="text-sm font-medium">{formatCurrency(step.cost)}</p>
                        </div>
                        
                        {step.estimatedTime && (
                          <div>
                            <p className="text-xs text-muted-foreground">Est. Time</p>
                            <p className="text-sm font-medium">{step.estimatedTime}</p>
                          </div>
                        )}
                        
                        {step.provider && (
                          <div>
                            <p className="text-xs text-muted-foreground">Provider</p>
                            <p className="text-sm font-medium">{step.provider}</p>
                          </div>
                        )}
                        
                        {step.teeth && step.teeth.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Teeth</p>
                            <p className="text-sm font-medium">{step.teeth.join(", ")}</p>
                          </div>
                        )}
                      </div>
                      
                      {step.status !== "completed" && step.status !== "cancelled" && (
                        <div className="flex justify-end mt-3 gap-2">
                          {step.status !== "scheduled" && (
                            <Button variant="outline" size="sm" className="gap-1">
                              <CalendarCheck className="h-4 w-4" />
                              Schedule
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1">
                            <Check className="h-4 w-4" />
                            Mark Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPlan.aiGenerated && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium text-primary mb-2">AI Treatment Recommendations</h4>
                      <p className="text-sm">
                        This treatment plan was generated by DentaMind based on the patient's dental history, 
                        x-rays, and current conditions. The plan prioritizes urgent treatments while optimizing for 
                        cost-effectiveness and long-term oral health.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1 border-primary/50 text-primary"
                        >
                          <InfoIcon className="h-4 w-4" />
                          View AI Reasoning
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Accept Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPlan.consentSigned && (
                <div className="bg-green-50 p-3 rounded-md flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Patient Consent Signed</p>
                    <p className="text-xs text-green-700">
                      Patient signed consent for this treatment plan on {new Date(selectedPlan.consentDate!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Plan
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Options
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedPlan.status === "draft" && (
                    <Button className="gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Activate Plan
                    </Button>
                  )}
                  {selectedPlan.status === "active" && !selectedPlan.consentSigned && (
                    <Button className="gap-2">
                      <FileText className="h-4 w-4" />
                      Record Consent
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}