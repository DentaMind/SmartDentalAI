import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Pencil, Check, Clock, Banknote } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TreatmentProcedure {
  code: string;
  description: string;
  fee: number;
  tooth?: string;
  surface?: string;
  quadrant?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

interface StructuredTreatmentPlan {
  proceduresList: TreatmentProcedure[];
  estimatedTotalCost: number;
  appointmentsRequired: number;
  insuranceEstimate?: number;
  patientResponsibility?: number;
  urgency: 'urgent' | 'high' | 'normal' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  notes: string;
  doctorEdited: boolean;
}

export default function TreatmentPlanEditor({ patientId }: { patientId: string }) {
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [editedPlan, setEditedPlan] = useState<string>("");
  const [structuredPlan, setStructuredPlan] = useState<StructuredTreatmentPlan | null>(null);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<"text" | "structured">("structured");
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTreatmentPlan = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/treatment/${patientId}`);
        const planData = response.data;
        
        setAiPlan(planData);
        setEditedPlan(planData.approved_plan || planData.ai_draft);
        
        // If there's structured data available, parse it
        if (planData.structured_data) {
          try {
            const structuredData = typeof planData.structured_data === 'string' 
              ? JSON.parse(planData.structured_data) 
              : planData.structured_data;
            
            setStructuredPlan(structuredData);
          } catch (err) {
            console.error("Error parsing structured treatment plan:", err);
            // Initialize with default structured plan if parsing fails
            initializeDefaultStructuredPlan();
          }
        } else {
          // Initialize with default structured plan if none exists
          initializeDefaultStructuredPlan();
        }
      } catch (err) {
        console.error("Error fetching treatment plan:", err);
        toast({ 
          title: "Error", 
          description: "Failed to load treatment plan data.", 
          variant: "destructive" 
        });
        initializeDefaultStructuredPlan();
      } finally {
        setLoading(false);
      }
    };
    
    fetchTreatmentPlan();
  }, [patientId, toast]);

  const initializeDefaultStructuredPlan = () => {
    const defaultPlan: StructuredTreatmentPlan = {
      proceduresList: [],
      estimatedTotalCost: 0,
      appointmentsRequired: 1,
      urgency: 'normal',
      complexity: 'simple',
      notes: "",
      doctorEdited: false
    };
    setStructuredPlan(defaultPlan);
  };

  const addProcedure = () => {
    if (!structuredPlan) return;
    
    const newProcedure: TreatmentProcedure = {
      code: "",
      description: "New Procedure",
      fee: 0,
      priority: 'normal'
    };
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: [...structuredPlan.proceduresList, newProcedure],
      doctorEdited: true
    });
    
    setIsEdited(true);
  };

  const updateProcedure = (index: number, field: keyof TreatmentProcedure, value: any) => {
    if (!structuredPlan) return;
    
    const updatedProcedures = [...structuredPlan.proceduresList];
    updatedProcedures[index] = {
      ...updatedProcedures[index],
      [field]: value
    };
    
    // Recalculate total cost if fee is updated
    let newTotalCost = structuredPlan.estimatedTotalCost;
    if (field === 'fee') {
      newTotalCost = updatedProcedures.reduce((sum, proc) => sum + (proc.fee || 0), 0);
    }
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: updatedProcedures,
      estimatedTotalCost: newTotalCost,
      doctorEdited: true
    });
    
    setIsEdited(true);
  };

  const removeProcedure = (index: number) => {
    if (!structuredPlan) return;
    
    const updatedProcedures = structuredPlan.proceduresList.filter((_, i) => i !== index);
    const newTotalCost = updatedProcedures.reduce((sum, proc) => sum + (proc.fee || 0), 0);
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: updatedProcedures,
      estimatedTotalCost: newTotalCost,
      doctorEdited: true
    });
    
    setIsEdited(true);
  };

  const submitApprovedPlan = async () => {
    setSubmitting(true);
    try {
      // Prepare the payload
      const payload = {
        approved_plan: editedPlan,
        edited_by_provider: isEdited,
        structured_data: structuredPlan,
        schedule_appointments: isSchedulingEnabled
      };
      
      await axios.post(`/api/treatment/${patientId}/approve`, payload);
      
      toast({ 
        title: "Treatment Plan Saved", 
        description: "The provider-approved plan has been stored.",
        variant: "default" 
      });
      
      // Log this action in the patient notes if appropriate
      try {
        await axios.post(`/api/notes/auto`, {
          patientId,
          title: "Treatment Plan Approved",
          content: `Provider approved treatment plan${isEdited ? " with modifications" : ""}. ${structuredPlan?.proceduresList.length || 0} procedures, estimated cost: $${structuredPlan?.estimatedTotalCost || 0}.`,
          source: "treatment_plan",
          autoGenerated: true
        });
      } catch (noteErr) {
        console.error("Error logging treatment plan approval to notes:", noteErr);
      }
    } catch (err) {
      console.error("Error saving treatment plan:", err);
      toast({ 
        title: "Error", 
        description: "Failed to save treatment plan.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'complex': return 'bg-purple-100 text-purple-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'simple': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner className="h-8 w-8 text-primary mr-2" />
        <p>Loading treatment plan...</p>
      </div>
    );
  }

  if (!aiPlan) {
    return (
      <Card className="p-4">
        <CardContent className="pt-4 text-center">
          <p>No treatment plan data available.</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">AI-Powered Treatment Plan</CardTitle>
            <CardDescription>Treatment recommendations based on patient data analysis</CardDescription>
          </div>
          {isEdited && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Pencil className="h-3 w-3 mr-1" /> Doctor Edited
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="flex items-center">
            <Banknote className="h-3.5 w-3.5 mr-1 text-green-600" />
            Est. Cost: ${structuredPlan?.estimatedTotalCost || 0}
          </Badge>
          
          <Badge variant="outline" className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1 text-blue-600" />
            Appointments: {structuredPlan?.appointmentsRequired || 1}
          </Badge>
          
          {structuredPlan?.urgency && (
            <Badge className={getPriorityColor(structuredPlan.urgency)}>
              Urgency: {structuredPlan.urgency.charAt(0).toUpperCase() + structuredPlan.urgency.slice(1)}
            </Badge>
          )}
          
          {structuredPlan?.complexity && (
            <Badge className={getComplexityColor(structuredPlan.complexity)}>
              Complexity: {structuredPlan.complexity.charAt(0).toUpperCase() + structuredPlan.complexity.slice(1)}
            </Badge>
          )}
          
          <Badge variant="outline" className="flex items-center">
            AI Confidence: {aiPlan.confidence || 75}%
          </Badge>
        </div>

        <Separator />
        
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "text" | "structured")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structured">Structured Plan</TabsTrigger>
            <TabsTrigger value="text">Text Format</TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured" className="space-y-4 pt-4">
            {structuredPlan && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Procedures</h3>
                    <Button size="sm" variant="outline" onClick={addProcedure}>
                      Add Procedure
                    </Button>
                  </div>
                  
                  {structuredPlan.proceduresList.length === 0 ? (
                    <div className="text-center p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">No procedures added yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={addProcedure}>
                        Add First Procedure
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {structuredPlan.proceduresList.map((procedure, index) => (
                        <Card key={index} className="p-3 border border-muted">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{procedure.code || "No Code"}</Badge>
                                <span className="font-medium">{procedure.description}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>${procedure.fee}</span>
                                {procedure.tooth && <span>• Tooth {procedure.tooth}</span>}
                                {procedure.surface && <span>• Surface {procedure.surface}</span>}
                                {procedure.quadrant && <span>• Quad {procedure.quadrant}</span>}
                              </div>
                              
                              <Badge className={getPriorityColor(procedure.priority)}>
                                {procedure.priority.charAt(0).toUpperCase() + procedure.priority.slice(1)}
                              </Badge>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => removeProcedure(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2">Notes</h3>
                  <Textarea
                    value={structuredPlan.notes}
                    onChange={(e) => {
                      setStructuredPlan({
                        ...structuredPlan,
                        notes: e.target.value,
                        doctorEdited: true
                      });
                      setIsEdited(true);
                    }}
                    placeholder="Add treatment notes here..."
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="text" className="space-y-4 pt-4">
            <div>
              <h3 className="text-base font-medium mb-2">Treatment Plan</h3>
              <Textarea
                value={editedPlan}
                onChange={(e) => {
                  setEditedPlan(e.target.value);
                  setIsEdited(true);
                }}
                placeholder="Enter treatment plan details..."
                className="min-h-[200px]"
              />
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-2">AI Reasoning</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line p-3 bg-muted rounded-md">
                {aiPlan.reasoning || "No AI reasoning provided."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule-appointments"
              checked={isSchedulingEnabled}
              onCheckedChange={setIsSchedulingEnabled}
            />
            <Label htmlFor="schedule-appointments">Schedule appointments for approved procedures</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            {activeView === "structured" && (
              <Button 
                variant="outline" 
                onClick={() => setActiveView("text")}
              >
                View Text Version
              </Button>
            )}
            
            <Button 
              onClick={submitApprovedPlan} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Approve & Save
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}